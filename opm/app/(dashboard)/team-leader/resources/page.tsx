import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User, Server, ProxyItem, SeedEmail, Rdp, Team, UserRole } from "@/lib/types"
import type { CookieOptions } from "@supabase/ssr"
import TLResourcesClientPage from "./resources-client-page"

async function getTLResourcesPageData() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options: CookieOptions) => {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Ignored */
      }
    },
    remove: (name: string, options: CookieOptions) => {
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
    .select("*, teams!fk_profiles_team_id(id, name)")
    .eq("id", authUser.id)
    .single()

  const { data: allUsersData, error: allUsersError } = await supabase
    .from("profiles")
    .select("id, name, email, role, team_id, avatar_url")

  if (profileError || !profileData) {
    console.error("Error fetching TL profile or profile not found:", profileError)
    redirect("/dashboard")
  }

  const currentUser: User & { teams?: Team } = {
    id: profileData.id,
    name: profileData.name || "User",
    email: authUser.email,
    role: profileData.role as UserRole,
    team_id: profileData.team_id,
    avatar_url: profileData.avatar_url,
    teams: profileData.teams || undefined, // Ensure null is converted to undefined
  }

  if (currentUser.role !== "team-leader" || !currentUser.team_id) {
    redirect("/dashboard")
  }

  const teamId = currentUser.team_id!

  // Fetch resources for the team
  const { data: serversData, error: serversError } = await supabase.from("servers").select("*").eq("team_id", teamId)
  if (serversError) console.error("Error fetching servers:", serversError)

  const { data: proxiesData, error: proxiesError } = await supabase.from("proxies").select("*").eq("team_id", teamId)
  if (proxiesError) console.error("Error fetching proxies:", proxiesError)

  const { data: seedEmailsData, error: seedEmailsError } = await supabase
    .from("seed_emails")
    .select("*")
    .eq("team_id", teamId)
  if (seedEmailsError) console.error("Error fetching seed emails:", seedEmailsError)

  const { data: rdpsData, error: rdpsError } = await supabase.from("rdps").select("*").eq("team_id", teamId)
  if (rdpsError) console.error("Error fetching RDPs:", rdpsError)

  // Fetch mailers for the team, including profile details
  const { data: teamMailersData, error: mailersError } = await supabase
    .from("profiles")
    .select(
      "id, name, email, role, team_id, avatar_url, isp_focus, entry_date, age, address, phone, actual_salary, gender, username",
    )
    .eq("role", "mailer")
    .eq("team_id", teamId)
  if (mailersError) console.error("Error fetching team mailers:", mailersError)

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
    allUsersForSimulator,
    initialServers: (serversData as Server[]) || [],
    initialProxies: (proxiesData as ProxyItem[]) || [],
    initialSeedEmails: (seedEmailsData as SeedEmail[]) || [],
    initialRdps: (rdpsData as Rdp[]) || [],
    initialTeamMailers: (teamMailersData as User[]) || [],
  }
}

export default async function TLResourcesPage() {
  const {
    currentUser,
    allUsersForSimulator,
    initialServers,
    initialProxies,
    initialSeedEmails,
    initialRdps,
    initialTeamMailers,
  } = await getTLResourcesPageData()

  return (
    <TLResourcesClientPage
      currentUser={currentUser}
      allUsers={allUsersForSimulator}
      initialServers={initialServers}
      initialProxies={initialProxies}
      initialSeedEmails={initialSeedEmails}
      initialRdps={initialRdps}
      initialTeamMailers={initialTeamMailers}
    />
  )
}
