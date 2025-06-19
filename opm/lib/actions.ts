import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"
import type { User } from "@supabase/supabase-js" // Import User type from supabase-js

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
  role: string | null
  team_id: string | null
}

type UserData = {
  user: User | null // Use the imported User type
  profile: UserProfile | null
}

/**
 * Fetches the authenticated user's session and profile data from Supabase.
 * This function is intended for server-side use.
 * @returns An object containing the user and their profile, or an error.
 */
export async function getUser(): Promise<{ data: UserData | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Error fetching user from auth:", authError.message)
    return { data: null, error: authError.message }
  }

  if (!user) {
    return { data: { user: null, profile: null }, error: "No authenticated user found." }
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError) {
    console.error("Error fetching user profile:", profileError.message)
    return { data: null, error: profileError.message }
  }

  // Merge user and profile data, including role and team_id in user_metadata for convenience
  const mergedUser = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      role: profile?.role || null,
      team_id: profile?.team_id || null,
    },
  } as User // Cast to User type

  return { data: { user: mergedUser, profile: profile }, error: null }
}
