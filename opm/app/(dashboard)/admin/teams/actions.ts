"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Helper to get a Supabase client with service_role key for admin actions
function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.")
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createTeam(formData: FormData) {
  const teamName = formData.get("newTeamName") as string

  if (!teamName || teamName.trim() === "") {
    return { error: "Team name cannot be empty." }
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
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to create a team." }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return { error: "You do not have permission to create a team." }
  }

  const { error } = await supabase.from("teams").insert({ name: teamName.trim() })

  if (error) {
    console.error("Error creating team:", error)
    if (error.code === "23505") {
      return { error: "A team with this name already exists." }
    }
    return { error: "Database error: Could not create the team." }
  }

  revalidatePath("/admin/teams")
  return { error: null, success: true, message: "Team created successfully!" }
}

export async function createTeamLeader(formData: FormData) {
  const email = formData.get("newTlEmail") as string
  const password = formData.get("newTlPassword") as string
  const name = formData.get("newTlName") as string
  const teamId = formData.get("assignTlToTeamId") as string

  if (!email || !password || !name || !teamId) {
    return { error: "Email, password, name, and team assignment are required." }
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    // user_metadata is for general info, app_metadata is for JWT claims
    // We will set app_metadata after profile update to ensure consistency
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { error: `Failed to create user: ${authError.message}` }
  }

  if (!authUser || !authUser.user) {
    return { error: "User creation did not return a user object." }
  }

  // The `handle_new_user` trigger populates profiles.email, profiles.name (if in user_metadata on signup)
  // We need to ensure name is set if not passed via user_metadata in createUser, and set role/team_id
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      role: "team-leader",
      team_id: teamId,
      name: name, // Explicitly set name here
    })
    .eq("id", authUser.user.id)

  if (profileError) {
    console.error("Error updating profile for new team leader:", profileError)
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Failed to update profile for new team leader: ${profileError.message}` }
  }

  // Update app_metadata for JWT role claim
  const { error: appMetaError } = await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
    app_metadata: { role: "team-leader", team_id: teamId },
  })
  if (appMetaError) {
    console.warn("Error updating app_metadata for new team leader:", appMetaError)
    // Not rolling back user creation for this, but it's important for RLS
  }

  revalidatePath("/admin/teams")
  return { error: null, success: true, message: "Team Leader created successfully!" }
}
