import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User, Team } from "@/lib/types"
import { AdminTeamsClientPage } from "./teams-client-page"
import type { CookieOptions } from "@supabase/ssr"

async function getTeamsAndUsers() {
  const cookieStore = await cookies() // Added await here
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        // The `set` method is not available in Server Components.
        // This can be ignored if you have middleware refreshing
        // user sessions.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        // The `delete` method is not available in Server Components.
      }
    },
  })

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    // Redirect non-admins away to the main dashboard
    redirect("/dashboard")
  }

  const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").order("created_at")
  const { data: usersData, error: usersError } = await supabase
    .from("profiles")
    .select("id, name, email, role, team_id")

  if (teamsError || usersError) {
    console.error("Error fetching teams or users:", teamsError || usersError)
    // Return empty arrays on error to prevent crashing the page
    return { teams: [], users: [] }
  }

  return {
    teams: (teamsData as Team[]) || [],
    users: (usersData as User[]) || [],
  }
}

export default async function AdminTeamsPage() {
  const { teams, users } = await getTeamsAndUsers()

  return <AdminTeamsClientPage initialTeams={teams} initialUsers={users} />
}
