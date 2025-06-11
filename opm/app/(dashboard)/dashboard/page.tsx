import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User, Team, UserRole, Gender } from "@/lib/types" // Ensure UserRole and Gender are imported
import { DashboardClientContent, type DashboardStats } from "../dashboard-client-content"
import type { CookieOptions } from "@supabase/ssr"

async function getDashboardData(): Promise<{
  initialUser: User & { teams: Team | null }
  allUsersForSimulator: User[]
  stats: DashboardStats
}> {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Middleware handling */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        /* Middleware handling */
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

  const { data: dbProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(id, name)")
    .eq("id", authUser.id)
    .single()

  if (profileError || !dbProfile) {
    console.error("Dashboard: Auth profile error:", profileError)
    redirect("/login")
  }

  const initialUser: User & { teams: Team | null } = {
    id: dbProfile.id,
    name: dbProfile.name || dbProfile.username || "User",
    email: authUser.email || undefined,
    role: dbProfile.role as UserRole, // This will now use the imported UserRole
    team_id: dbProfile.team_id || undefined,
    avatar_url: dbProfile.avatar_url || undefined,
    isp_focus: dbProfile.isp_focus || undefined,
    entry_date: dbProfile.entry_date || undefined,
    age: dbProfile.age || undefined,
    address: dbProfile.address || undefined,
    phone: dbProfile.phone || undefined,
    actual_salary: dbProfile.actual_salary || undefined,
    gender: (dbProfile.gender as Gender) || undefined, // This will use the imported Gender
    teams: dbProfile.teams as Team | null,
  }

  const { data: allDbProfiles, error: allUsersError } = await supabase
    .from("profiles")
    .select("id, username, name, role, team_id, avatar_url, email") // Ensure 'email' is selected if needed for User type

  if (allUsersError) {
    console.error("Error fetching all users for simulator:", allUsersError)
  }

  const allUsersForSimulator: User[] = (allDbProfiles || []).map((profile) => ({
    id: profile.id,
    name: profile.name || profile.username || "User",
    // Supabase auth email might not be in profiles table directly,
    // so ensure your User type and this mapping handle it.
    // If profile.email is from the profiles table, ensure it's selected.
    // If it should be from auth.users, this mapping might need adjustment or UserRoleSimulator might need to fetch it.
    email: profile.email || undefined, // Assuming profile might have an email field
    role: profile.role as UserRole, // This will now use the imported UserRole
    team_id: profile.team_id || undefined,
    avatar_url: profile.avatar_url || undefined,
    // Ensure all required fields for User type are mapped here
    isp_focus: undefined, // Add other fields from User type if UserRoleSimulator uses them
    entry_date: undefined,
    age: undefined,
    address: undefined,
    phone: undefined,
    actual_salary: undefined,
    gender: undefined,
  }))

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: totalTeamLeaders } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "team-leader")
  const { count: totalMailers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "mailer")
  const { count: totalServers } = await supabase.from("servers").select("*", { count: "exact", head: true })
  const { count: activeServers } = await supabase
    .from("servers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
  const { count: returnedServers } = await supabase
    .from("servers")
    .select("*", { count: "exact", head: true })
    .eq("status", "returned")
  const { count: totalSeedEmails } = await supabase.from("seed_emails").select("*", { count: "exact", head: true })
  const { count: activeSeedEmails } = await supabase
    .from("seed_emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
  const { count: warmupSeedEmails } = await supabase
    .from("seed_emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "warmup")
  const { count: totalProxies } = await supabase.from("proxies").select("*", { count: "exact", head: true })
  const { count: activeProxies } = await supabase
    .from("proxies")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
  const { count: returnedProxies } = await supabase
    .from("proxies")
    .select("*", { count: "exact", head: true })
    .eq("status", "returned")

  const stats: DashboardStats = {
    totalUsers: totalUsers ?? 0,
    totalTeamLeaders: totalTeamLeaders ?? 0,
    totalMailers: totalMailers ?? 0,
    totalServers: totalServers ?? 0,
    activeServers: activeServers ?? 0,
    returnedServers: returnedServers ?? 0,
    totalSeedEmails: totalSeedEmails ?? 0,
    activeSeedEmails: activeSeedEmails ?? 0,
    warmupSeedEmails: warmupSeedEmails ?? 0,
    totalProxies: totalProxies ?? 0,
    activeProxies: activeProxies ?? 0,
    returnedProxies: returnedProxies ?? 0,
  }

  return {
    initialUser,
    allUsersForSimulator,
    stats,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return (
    <DashboardClientContent
      initialUser={data.initialUser}
      allUsersForSimulator={data.allUsersForSimulator}
      stats={data.stats}
    />
  )
}

// REMOVED local UserRole and Gender definitions:
// export type UserRole = "admin" | "team-leader" | "mailer" | "user"
// export type Gender = "male" | "female" | "other"
