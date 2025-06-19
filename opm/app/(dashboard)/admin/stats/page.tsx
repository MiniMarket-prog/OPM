import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User, Team, Server as ServerType, SeedEmail, ProxyItem, Rdp } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js" // Import SupabaseClient type
import type { Database } from "@/lib/database.types" // Ensure Database type is imported
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Import the new client component
import { StatsClientPage } from "@/components/admin/stats-client-page"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82Ca9D"]

interface StatsData {
  serversPerTeam: Array<{ name: string; count: number }>
  mailersPerTeam: Array<{ name: string; count: number }>
  teamLeadersPerTeam: Array<{ name: string; count: number }>
  seedEmailStatusChartData: Array<{ name: string; value: number }>
  proxiesPerTeam: Array<{ name: string; count: number }>
  rdpsPerTeam: Array<{ name: string; count: number }>
  serverStatus: Array<{ name: string; value: number }>
  proxyStatus: Array<{ name: string; value: number }>
  rdpStatus: Array<{ name: string; value: number }>
  totalTeams: number
  totalUsers: number
  totalTLs: number
  totalMailers: number
  totalServers: number
  totalSeedEmails: number
  totalProxies: number
  totalRdps: number
  allUsersForSimulator: User[]
  currentSimulatedUser?: User
  error?: string
}

function getDefaultStatsData(errorMsg?: string, allUsers: User[] = []): StatsData {
  return {
    serversPerTeam: [],
    mailersPerTeam: [],
    teamLeadersPerTeam: [],
    seedEmailStatusChartData: [],
    proxiesPerTeam: [],
    rdpsPerTeam: [],
    serverStatus: [],
    proxyStatus: [],
    rdpStatus: [],
    totalTeams: 0,
    totalUsers: 0,
    totalTLs: 0,
    totalMailers: 0,
    totalServers: 0,
    totalSeedEmails: 0,
    totalProxies: 0,
    totalRdps: 0,
    allUsersForSimulator: allUsers,
    error: errorMsg,
  }
}

// Change the type of supabaseClient parameter
async function getStatsData(supabaseClient: SupabaseClient<Database>): Promise<StatsData> {
  try {
    const { data: teamsData, error: teamsError } = await supabaseClient.from("teams").select("*")
    if (teamsError) throw teamsError
    const teams = (teamsData as Team[]) || []

    const { data: usersData, error: usersError } = await supabaseClient.from("profiles").select("*")
    if (usersError) throw usersError
    const users = (usersData as User[]) || []

    const { data: serversData, error: serversError } = await supabaseClient.from("servers").select("*")
    if (serversError) throw serversError
    const servers = (serversData as ServerType[]) || []

    const { data: seedEmailsData, error: seedEmailsError } = await supabaseClient.from("seed_emails").select("*")
    if (seedEmailsError) throw seedEmailsError
    const seedEmails = (seedEmailsData as SeedEmail[]) || []

    const { data: proxiesData, error: proxiesError } = await supabaseClient.from("proxies").select("*")
    if (proxiesError) throw proxiesError
    const proxies = (proxiesData as ProxyItem[]) || []

    const { data: rdpsData, error: rdpsError } = await supabaseClient.from("rdps").select("*")
    if (rdpsError) throw rdpsError
    const rdps = (rdpsData as Rdp[]) || []

    // ... (rest of the data processing logic remains the same)
    const serversPerTeam = teams.map((team) => ({
      name: team.name,
      count: servers.filter((s) => s.team_id === team.id && s.status === "active").length,
    }))
    const mailersPerTeam = teams.map((team) => ({
      name: team.name,
      count: users.filter((u) => u.role === "mailer" && u.team_id === team.id).length,
    }))
    const teamLeadersPerTeam = teams.map((team) => ({
      name: team.name,
      count: users.filter((u) => u.role === "team-leader" && u.team_id === team.id).length,
    }))
    const seedEmailStatusDistribution = Object.groupBy(seedEmails, (item) => item.status) as Record<string, SeedEmail[]>
    const seedEmailStatusChartData = Object.entries(seedEmailStatusDistribution).map(([status, emailList]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: emailList.length,
    }))
    const proxiesPerTeam = teams.map((team) => ({
      name: team.name,
      count: proxies.filter((p) => p.team_id === team.id && p.status === "active").length,
    }))
    const rdpsPerTeam = teams.map((team) => ({
      name: team.name,
      count: rdps.filter((r) => r.team_id === team.id && r.status === "active").length,
    }))
    const resourceStatus = (resourceList: Array<{ status: string }>) => {
      const active = resourceList.filter((r) => r.status === "active").length
      const returned = resourceList.filter((r) => r.status === "returned").length
      const problem = resourceList.filter(
        (r) => r.status === "problem" || r.status === "maintenance" || r.status === "banned" || r.status === "slow",
      ).length
      return [
        { name: "Active", value: active },
        { name: "Returned", value: returned },
        { name: "Problem/Other", value: problem },
      ]
    }

    return {
      serversPerTeam,
      mailersPerTeam,
      teamLeadersPerTeam,
      seedEmailStatusChartData,
      proxiesPerTeam,
      rdpsPerTeam,
      serverStatus: resourceStatus(servers),
      proxyStatus: resourceStatus(proxies),
      rdpStatus: resourceStatus(rdps),
      totalTeams: teams.length,
      totalUsers: users.length,
      totalTLs: users.filter((u) => u.role === "team-leader").length,
      totalMailers: users.filter((u) => u.role === "mailer").length,
      totalServers: servers.length,
      totalSeedEmails: seedEmails.length,
      totalProxies: proxies.length,
      totalRdps: rdps.length,
      allUsersForSimulator: users,
    }
  } catch (error) {
    console.error("Error fetching stats data:", error)
    // Fallback to fetch allUsers if primary data fetch fails, to ensure UserRoleSimulator can populate
    const { data: allUsersDataFallback } = await supabaseClient.from("profiles").select("*")
    const allUsers = (allUsersDataFallback as User[]) || []
    return getDefaultStatsData(error instanceof Error ? error.message : "Unknown error fetching stats.", allUsers)
  }
}

export default async function AdminStatsPage({ searchParams }: { searchParams?: { simulatedUserId?: string } }) {
  const cookieStore = await cookies()
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login")
  }

  const { data: authUserProfileData, error: authProfileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(id, name)") // Updated line
    .eq("id", authUser.id)
    .single()

  if (authProfileError || !authUserProfileData) {
    console.error("Auth profile error:", authProfileError)
    return (
      <div className="container mx-auto p-4">
        <p>Error fetching your profile. Please try again.</p>
      </div>
    )
  }
  const authUserProfile = authUserProfileData as User & { teams: Team | null }

  if (authUserProfile.role !== "admin") {
    return (
      <div className="container mx-auto p-4">
        <p>Access Denied. You must be an Admin to view this page.</p>
      </div>
    )
  }

  const statsData = await getStatsData(supabase) // Pass the initialized client

  return <StatsClientPage statsData={statsData} authUserProfile={authUserProfile} searchParams={searchParams} />
}
