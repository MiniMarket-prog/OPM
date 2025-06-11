"use server"

import { revalidatePath } from "next/cache"
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

export async function approveUser(userId: string) {
  if (!userId) {
    return { error: "User ID is required." }
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const newRole = "mailer" // Default role for approved users

  // 1. Update the role in the public.profiles table
  const { error: profileError } = await supabaseAdmin.from("profiles").update({ role: newRole }).eq("id", userId)

  if (profileError) {
    console.error("Error updating user profile role:", profileError)
    return { error: `Database error: Could not update user role. ${profileError.message}` }
  }

  // 2. Update the app_metadata in auth.users to sync the role for RLS
  const { error: authUserError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole },
  })

  if (authUserError) {
    console.error("Error updating auth user metadata:", authUserError)
    // Note: At this point, the profile role is updated but the auth role isn't.
    // This is an inconsistent state. You might want to add logic to revert the profile change.
    // For now, we'll just report the error.
    return { error: `Auth error: Could not sync user role. ${authUserError.message}` }
  }

  revalidatePath("/admin/user-approval")
  revalidatePath("/admin/teams") // Also revalidate teams page in case user lists are shown there
  return { error: null, success: true }
}

export async function denyUser(userId: string) {
  if (!userId) {
    return { error: "User ID is required." }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Deleting the user from auth.users will cascade and delete the profile
  // due to the foreign key constraint with ON DELETE CASCADE.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.error("Error deleting user:", error)
    return { error: `Database error: Could not delete user. ${error.message}` }
  }

  revalidatePath("/admin/user-approval")
  return { error: null, success: true }
}
