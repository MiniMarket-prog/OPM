import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TLReturnsClientPage from "./returns-client-page"
import type { User, Team } from "@/lib/types" // Import User and Team types

export default async function TLReturnsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(*)")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "team-leader" || !profile.team_id) {
    if (!profile) {
      redirect("/login")
    }
    redirect("/dashboard")
  }

  // Fetch servers, proxies, and RDPs, joining with profiles to get mailer names
  const { data: servers, error: serversError } = await supabase
    .from("servers")
    .select("*, profiles!servers_added_by_mailer_id_fkey(full_name, name, username)") // Join to get mailer's full_name, name, username
    .eq("team_id", profile.team_id)
    .order("entry_date", { ascending: false })

  const { data: proxies, error: proxiesError } = await supabase
    .from("proxies")
    .select("*, profiles!proxies_added_by_mailer_id_fkey(full_name, name, username)") // Join to get mailer's full_name, name, username
    .eq("team_id", profile.team_id)
    .order("entry_date", { ascending: false })

  const { data: rdps, error: rdpsError } = await supabase
    .from("rdps")
    .select("*, profiles!rdps_added_by_mailer_id_fkey(full_name, name, username)") // Join to get mailer's full_name, name, username
    .eq("team_id", profile.team_id)
    .order("entry_date", { ascending: false })

  if (serversError || proxiesError || rdpsError) {
    console.error("Error fetching team leader resources:", {
      serversError,
      proxiesError,
      rdpsError,
    })
    // Redirect to dashboard or show an error message
    redirect("/dashboard")
  }

  return (
    <TLReturnsClientPage
      currentUser={profile as User & { teams: Team | null }} // Cast to ensure correct type for client component
      initialServers={servers || []}
      initialProxies={proxies || []}
      initialRdps={rdps || []}
    />
  )
}
