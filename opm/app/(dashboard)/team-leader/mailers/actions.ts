"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.")
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.")
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createMailer(formData: FormData) {
  const mailerName = formData.get("mailerName") as string
  const mailerEmail = formData.get("mailerEmail") as string
  const mailerPassword = formData.get("mailerPassword") as string
  const teamId = formData.get("teamId") as string

  if (!mailerName || !mailerEmail || !mailerPassword || !teamId) {
    return { error: "Name, email, password, and team ID are required." }
  }
  if (mailerPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." }
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Ignored */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        /* Ignored */
      }
    },
  })

  const {
    data: { user: callingUser },
  } = await supabase.auth.getUser()
  if (!callingUser) {
    return { error: "You must be logged in." }
  }

  const { data: callingUserProfile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("id", callingUser.id)
    .single()

  if (profileFetchError || !callingUserProfile) {
    return { error: "Could not verify your user profile." }
  }

  if (callingUserProfile.role !== "team-leader") {
    return { error: "Only Team Leaders can create Mailers." }
  }
  if (callingUserProfile.team_id !== teamId) {
    return { error: "Team Leader can only create Mailers for their own team." }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: mailerEmail,
    password: mailerPassword,
    email_confirm: true,
  })

  if (authError) {
    console.error("Error creating mailer auth user:", authError)
    return { error: `Failed to create mailer user: ${authError.message}` }
  }

  if (!authUser || !authUser.user) {
    return { error: "Mailer user creation did not return a user object." }
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      role: "mailer",
      team_id: teamId,
      name: mailerName,
    })
    .eq("id", authUser.user.id)

  if (profileError) {
    console.error("Error updating profile for new mailer:", profileError)
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Failed to update profile for new mailer: ${profileError.message}` }
  }

  const { error: appMetaError } = await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
    app_metadata: { role: "mailer", team_id: teamId },
  })
  if (appMetaError) {
    console.warn("Error updating app_metadata for new mailer:", appMetaError)
  }

  revalidatePath("/team-leader/mailers")
  revalidatePath("/admin/teams")
  return { error: null, success: true, message: "Mailer created successfully!" }
}
