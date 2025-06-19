import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User, Team } from "@/lib/types"
import { AdminTeamsClientPage } from "./teams-client-page"

async function getTeamsAndUsers() {
  const cookieStore = await cookies()
  // FIX: Call createSupabaseServerClient without arguments and await its result
  const supabase = await createSupabaseServerClient()

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
