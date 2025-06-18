import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClientContent } from "./dashboard-client-content" // Changed to named import
import { format } from "date-fns"
import type { User, Team, ResourceReturnItem } from "@/lib/types" // Import User, Team, ResourceReturnItem

async function getDashboardData() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(*)") // Explicitly select teams using the foreign key
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError)
    redirect("/login")
  }

  // Fetch all mailers
  const { data: allMailers, error: mailersError } = await supabase
    .from("profiles")
    .select("id, full_name, team_id")
    .eq("role", "mailer")

  if (mailersError) {
    console.error("Error fetching mailers:", mailersError)
    return {
      currentUser: profile as User & { teams: Team | null }, // Cast to include teams
      mailersNeedingRevenueLog: [],
      teamPendingReturns: [],
      totalServers: 0,
      totalProxies: 0,
      totalSeedEmails: 0,
      totalRdps: 0,
      totalMailers: 0,
      totalTeams: 0,
      totalPendingUsers: 0,
      totalUsers: 0, // Added
      totalTeamLeaders: 0, // Added
    }
  }

  const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd")

  const { data: loggedRevenues, error: revenueError } = await supabase
    .from("daily_revenues")
    .select("mailer_id")
    .eq("date", yesterday)

  if (revenueError) {
    console.error("Error fetching logged revenues:", revenueError)
    return {
      currentUser: profile as User & { teams: Team | null }, // Cast to include teams
      mailersNeedingRevenueLog: [],
      teamPendingReturns: [],
      totalServers: 0,
      totalProxies: 0,
      totalSeedEmails: 0,
      totalRdps: 0,
      totalMailers: 0,
      totalTeams: 0,
      totalPendingUsers: 0,
      totalUsers: 0, // Added
      totalTeamLeaders: 0, // Added
    }
  }

  const mailersWithRevenue = new Set(loggedRevenues?.map((r) => r.mailer_id))
  const mailersNeedingRevenueLog = allMailers?.filter((mailer) => !mailersWithRevenue.has(mailer.id)) || []

  // Filter mailers needing revenue log by team for Team Leaders
  const mailersNeedingRevenueLogForTL =
    profile.role === "team-leader"
      ? mailersNeedingRevenueLog.filter((mailer) => mailer.team_id === profile.team_id)
      : mailersNeedingRevenueLog

  // Fetch counts for resources
  const { count: totalServers, error: serversCountError } = await supabase
    .from("servers")
    .select("*", { count: "exact", head: true })

  const { count: totalProxies, error: proxiesCountError } = await supabase
    .from("proxies")
    .select("*", { count: "exact", head: true })

  const { count: totalSeedEmails, error: seedEmailsCountError } = await supabase
    .from("seed_emails")
    .select("*", { count: "exact", head: true })

  const { count: totalRdps, error: rdpsCountError } = await supabase
    .from("rdps")
    .select("*", { count: "exact", head: true })

  const { count: totalMailers, error: mailersCountError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "mailer")

  const { count: totalTeams, error: teamsCountError } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })

  // Fetch total users (all profiles not pending approval)
  const { count: totalUsers, error: usersCountError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .neq("role", "pending_approval") // Exclude pending approval users

  if (usersCountError) console.error("Error fetching total users:", usersCountError)

  // Fetch total team leaders
  const { count: totalTeamLeaders, error: teamLeadersCountError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "team-leader")

  if (teamLeadersCountError) console.error("Error fetching total team leaders:", teamLeadersCountError)

  // Fetch pending server returns for Team Leaders
  const { count: totalPendingUsers, error: pendingUsersError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "pending_approval")

  if (pendingUsersError) console.error("Error fetching total pending users:", pendingUsersError)

  let teamPendingReturns: ResourceReturnItem[] = [] // Explicitly type here
  if (profile.role === "team-leader" && profile.team_id) {
    const { data: pendingServers, error: pendingServersError } = await supabase
      .from("servers")
      .select("id, ip_address, status, user_id, profiles!servers_user_id_fkey(full_name)") // Explicitly select profiles using the user_id foreign key
      .eq("team_id", profile.team_id)
      .eq("status", "pending_return_approval")

    if (pendingServersError) {
      console.error("Error fetching pending server returns for TL:", pendingServersError)
    } else {
      // Map the data to match ResourceReturnItem structure
      teamPendingReturns = (pendingServers || []).map((server) => ({
        id: server.id,
        ip_address: server.ip_address,
        status: server.status,
        user_id: server.user_id,
        profiles: server.profiles ? [server.profiles] : null, // Ensure profiles is an array
      })) as ResourceReturnItem[]
    }
  }

  return {
    currentUser: profile as User & { teams: Team | null }, // Cast to include teams
    mailersNeedingRevenueLog: mailersNeedingRevenueLogForTL,
    teamPendingReturns: teamPendingReturns,
    totalServers: totalServers || 0,
    totalProxies: totalProxies || 0,
    totalSeedEmails: totalSeedEmails || 0,
    totalRdps: totalRdps || 0,
    totalMailers: totalMailers || 0,
    totalTeams: totalTeams || 0,
    totalPendingUsers: totalPendingUsers || 0,
    totalUsers: totalUsers || 0, // Added
    totalTeamLeaders: totalTeamLeaders || 0, // Added
  }
}

export default async function DashboardPage() {
  const {
    currentUser,
    mailersNeedingRevenueLog,
    teamPendingReturns,
    totalServers,
    totalProxies,
    totalSeedEmails,
    totalRdps,
    totalMailers,
    totalTeams,
    totalPendingUsers,
    totalUsers, // Destructure added prop
    totalTeamLeaders, // Destructure added prop
  } = await getDashboardData()

  return (
    <DashboardClientContent
      currentUser={currentUser}
      mailersNeedingRevenueLog={mailersNeedingRevenueLog}
      teamPendingReturns={teamPendingReturns}
      totalServers={totalServers}
      totalProxies={totalProxies}
      totalSeedEmails={totalSeedEmails}
      totalRdps={totalRdps}
      totalMailers={totalMailers}
      totalTeams={totalTeams}
      totalPendingUsers={totalPendingUsers}
      totalUsers={totalUsers} // Pass added prop
      totalTeamLeaders={totalTeamLeaders} // Pass added prop
    />
  )
}
