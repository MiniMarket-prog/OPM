import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User, UserRole } from "@/lib/types"
import { TeamLeaderMailersClientPage } from "./mailers-client-page" // New client component
import type { CookieOptions } from "@supabase/ssr"

async function getTeamLeaderPageData() {
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
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login")
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(id, name)") // Disambiguate the relationship
    .eq("id", authUser.id)
    .single()

  if (profileError || !profileData) {
    console.error("Error fetching TL profile or profile not found:", profileError)
    redirect("/dashboard") // Or an error page
  }

  const currentUser = {
    id: profileData.id,
    name: profileData.name || "User",
    email: authUser.email,
    role: profileData.role as UserRole,
    team_id: profileData.team_id,
    avatar_url: profileData.avatar_url,
    // teams: profileData.teams as Team | null // Supabase types might make this an object or null
  }

  if (currentUser.role !== "team-leader" || !currentUser.team_id) {
    // This check is now server-side, more reliable
    redirect("/dashboard") // Or a specific access-denied page
  }

  // The type of profileData.teams will be an object or null, not an array, because it's a to-one relationship.
  const teamName = profileData.teams?.name || "Unknown Team"

  const { data: teamMailersData, error: mailersError } = await supabase
    .from("profiles")
    .select("id, name, email, role, team_id")
    .eq("role", "mailer")
    .eq("team_id", currentUser.team_id)

  if (mailersError) {
    console.error("Error fetching team mailers:", mailersError)
    // Handle error, maybe return empty array or show error message
  }

  const { data: allUsersData, error: allUsersError } = await supabase
    .from("profiles")
    .select("id, name, email, role, team_id, avatar_url")

  if (allUsersError) {
    console.error("Error fetching all users for simulator:", allUsersError)
  }

  const allUsersForSimulator: User[] = (allUsersData || []).map((p) => ({
    id: p.id,
    name: p.name || "User",
    email: p.email || undefined,
    role: p.role as UserRole,
    team_id: p.team_id || undefined,
    avatar_url: p.avatar_url || undefined,
  }))

  return {
    currentUser,
    teamName,
    initialTeamMailers: (teamMailersData as User[]) || [],
    allUsersForSimulator,
  }
}

export default async function TeamLeaderMailersPage() {
  const { currentUser, teamName, initialTeamMailers, allUsersForSimulator } = await getTeamLeaderPageData()

  // The server-side check already handles redirection if not a TL or no team.
  // So, we can directly render the client page.
  return (
    <TeamLeaderMailersClientPage
      currentUser={currentUser}
      teamName={teamName}
      initialTeamMailers={initialTeamMailers}
      allUsersForSimulator={allUsersForSimulator}
    />
  )
}
