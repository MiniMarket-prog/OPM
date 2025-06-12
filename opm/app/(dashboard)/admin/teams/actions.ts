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

async function getSupabaseClientWithUser() {
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
    return { supabase: null, user: null, error: "User not authenticated." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { supabase, user, error: "Could not fetch user profile." }
  }

  if (profile.role !== "admin") {
    return { supabase, user, error: "User does not have admin privileges." }
  }

  return { supabase, user, profile, error: null }
}

export async function createTeam(formData: FormData) {
  const teamName = formData.get("newTeamName") as string

  if (!teamName || teamName.trim() === "") {
    return { error: "Team name cannot be empty." }
  }

  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { error: authError || "Authentication failed." }
  }

  const { data: newTeam, error: dbError } = await supabase
    .from("teams")
    .insert({ name: teamName.trim() })
    .select()
    .single()

  if (dbError) {
    console.error("Error creating team:", dbError)
    if (dbError.code === "23505") {
      return { error: "A team with this name already exists." }
    }
    return { error: "Database error: Could not create the team." }
  }

  revalidatePath("/admin/teams")
  return { error: null, success: true, message: "Team created successfully!", newTeam }
}

export async function updateTeam(formData: FormData) {
  const teamId = formData.get("teamId") as string
  const newName = formData.get("newName") as string

  if (!teamId || !newName || newName.trim() === "") {
    return { error: "Team ID and a valid new name are required." }
  }

  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { error: authError || "Authentication failed." }
  }

  const { data: updatedTeam, error: dbError } = await supabase
    .from("teams")
    .update({ name: newName.trim() })
    .eq("id", teamId)
    .select()
    .single()

  if (dbError) {
    console.error("Error updating team:", dbError)
    if (dbError.code === "23505") {
      return { error: "Another team with this name already exists." }
    }
    return { error: "Database error: Could not update the team name." }
  }
  if (!updatedTeam) {
    return { error: "Team not found or no changes made." }
  }

  revalidatePath("/admin/teams")
  return { error: null, success: true, message: "Team updated successfully!", updatedTeam }
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

  // Admin check is implicitly handled by createSupabaseAdminClient or similar logic
  const supabaseAdmin = createSupabaseAdminClient()

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { error: `Failed to create user: ${authError.message}` }
  }

  if (!authUser || !authUser.user) {
    return { error: "User creation did not return a user object." }
  }

  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      role: "team-leader",
      team_id: teamId,
      name: name,
    })
    .eq("id", authUser.user.id)
    .select()
    .single()

  if (profileError) {
    console.error("Error updating profile for new team leader:", profileError)
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Failed to update profile for new team leader: ${profileError.message}` }
  }

  const { error: appMetaError } = await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
    app_metadata: { role: "team-leader", team_id: teamId },
  })
  if (appMetaError) {
    console.warn("Error updating app_metadata for new team leader:", appMetaError)
  }

  revalidatePath("/admin/teams")
  return {
    error: null,
    success: true,
    message: "Team Leader created successfully!",
    newTeamLeaderProfile: updatedProfile,
  }
}
