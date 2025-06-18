import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User, Server, ProxyItem, SeedEmail, Rdp, Team, UserRole, Gender } from "@/lib/types" // Import Gender type
import TLResourcesClientPage from "./resources-client-page"

async function getTLResourcesPageData() {
  const supabase = await createSupabaseServerClient()

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
    .select("id, username, email, role, team_id, avatar_url") // Select username instead of name

  if (profileError || !profileData) {
    console.error("Error fetching TL profile or profile not found:", profileError)
    redirect("/dashboard")
  }

  const currentUser: User & { teams?: Team } = {
    id: profileData.id,
    name: profileData.full_name || profileData.username || "User", // Use full_name or username for name
    email: authUser.email,
    role: profileData.role as UserRole,
    team_id: profileData.team_id,
    avatar_url: profileData.avatar_url,
    teams: profileData.teams || undefined, // Ensure null is converted to undefined
  }

  // Corrected comparison: assuming UserRole uses "team-leader" (kebab-case)
  if (currentUser.role !== "team-leader" && currentUser.role !== "admin") {
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
      "id, username, email, role, team_id, avatar_url, isp_focus, entry_date, age, address, phone, actual_salary, gender, full_name", // Include full_name
    )
    .eq("role", "mailer")
    .eq("team_id", teamId)
  if (mailersError) console.error("Error fetching team mailers:", mailersError)

  // Explicitly type 'p' based on the selected columns and map username to name
  const allUsersForSimulator: User[] = (allUsersData || []).map(
    (p: {
      id: string
      username: string | null
      email: string | null
      role: string | null
      team_id: string | null
      avatar_url: string | null
    }) => ({
      id: p.id,
      name: p.username || "User", // Map username to name
      email: p.email || undefined,
      role: p.role as UserRole,
      team_id: p.team_id || undefined,
      avatar_url: p.avatar_url || undefined,
    }),
  )

  // Map teamMailersData to User type, using full_name or username for name
  const initialTeamMailers: User[] = (teamMailersData || []).map(
    (p: {
      id: string
      username: string | null
      email: string | null
      role: string | null
      team_id: string | null
      avatar_url: string | null
      isp_focus: string[] | null
      entry_date: string | null
      age: number | null
      address: string | null
      phone: string | null
      actual_salary: number | null
      gender: string | null // Keep as string | null for the raw data
      full_name: string | null // Ensure full_name is selected
    }) => ({
      id: p.id,
      name: p.full_name || p.username || "Mailer", // Use full_name or username for name
      email: p.email || undefined,
      role: p.role as UserRole,
      team_id: p.team_id || undefined,
      avatar_url: p.avatar_url || undefined,
      isp_focus: p.isp_focus,
      entry_date: p.entry_date,
      age: p.age,
      address: p.address,
      phone: p.phone,
      actual_salary: p.actual_salary,
      gender: p.gender as Gender | null, // Type assertion here
    }),
  )

  return {
    currentUser,
    allUsersForSimulator,
    initialServers: (serversData as Server[]) || [],
    initialProxies: (proxiesData as ProxyItem[]) || [],
    initialSeedEmails: (seedEmailsData as SeedEmail[]) || [],
    initialRdps: (rdpsData as Rdp[]) || [],
    initialTeamMailers: initialTeamMailers, // Use the mapped mailers
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
