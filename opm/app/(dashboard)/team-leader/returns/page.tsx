import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TLReturnsClientPage from "./returns-client-page"
import type { Server, ProxyItem, Rdp, User, Team } from "@/lib/types"

export default async function TeamLeaderReturnsServerPage() {
  const supabase = await createSupabaseServerClient() // Await the async function

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(id, name)")
    .eq("id", user.id)
    .single()

  if (profileError || !profileData) {
    console.error("Error fetching Team Leader profile:", profileError?.message)
    return redirect("/dashboard") // Redirect if profile not found or error
  }

  const typedProfile = profileData as User & { teams: Team }

  // Ensure user is a team-leader and has a team_id
  if (typedProfile.role !== "team-leader" || !typedProfile.team_id) {
    console.log(
      `User ${typedProfile.id} is not a team-leader or has no team_id. Role: ${typedProfile.role}, Team ID: ${typedProfile.team_id}`,
    )
    return redirect("/dashboard")
  }

  // Fetch servers, proxies, and RDPs for the team leader's team
  const { data: teamServers } = await supabase
    .from("servers")
    .select("*")
    .eq("team_id", typedProfile.team_id)
    .in("status", ["active", "maintenance", "problem", "returned", "pending_return_approval"]) // Include all relevant statuses

  const { data: teamProxies } = await supabase
    .from("proxies")
    .select("*")
    .eq("team_id", typedProfile.team_id)
    .in("status", ["active", "maintenance", "problem", "returned"])

  const { data: teamRdps } = await supabase
    .from("rdps")
    .select("*")
    .eq("team_id", typedProfile.team_id)
    .in("status", ["active", "maintenance", "problem", "returned"])

  return (
    <TLReturnsClientPage
      currentUser={typedProfile}
      initialServers={(teamServers as Server[]) || []}
      initialProxies={(teamProxies as ProxyItem[]) || []}
      initialRdps={(teamRdps as Rdp[]) || []}
    />
  )
}
