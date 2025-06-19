import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MailerResourcesClientPage from "./mailer-resources-client-page"
import type { User, Team, Server, ProxyItem, SeedEmail, Rdp, DailyRevenue } from "@/lib/types" // Import specific types

export default async function MailerResourcesPage() {
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

  // Type assertion for profile to match User type, as role is now string | null
  const currentUserProfile: User & { teams?: Team | null } = profile as User & { teams?: Team | null }

  if (profileError || !profile || currentUserProfile.role !== "mailer" || !currentUserProfile.team_id) {
    if (!profile) {
      redirect("/login")
    }
    redirect("/dashboard")
  }

  const { data: servers, error: serversError } = (await supabase
    .from("servers")
    .select("*, profiles!servers_added_by_mailer_id_fkey(full_name)") // Join profiles to get mailer name
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })) as { data: Server[] | null; error: any }

  const { data: proxies, error: proxiesError } = (await supabase
    .from("proxies")
    .select("*, profiles!proxies_added_by_mailer_id_fkey(full_name)") // Join profiles to get mailer name
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })) as { data: ProxyItem[] | null; error: any }

  const { data: seedEmails, error: seedEmailsError } = (await supabase
    .from("seed_emails")
    .select("*, profiles!seed_emails_user_id_fkey(full_name)") // Join profiles to get mailer name
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })) as { data: SeedEmail[] | null; error: any }

  const { data: rdps, error: rdpsError } = (await supabase
    .from("rdps")
    .select("*, profiles!rdps_user_id_fkey(full_name)") // Join profiles to get mailer name
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })) as { data: Rdp[] | null; error: any }

  const { data: dailyRevenues, error: dailyRevenuesError } = (await supabase
    .from("daily_revenues")
    .select("*")
    .eq("mailer_id", user.id)
    .order("date", { ascending: false })) as { data: DailyRevenue[] | null; error: any }

  const { data: allUsers, error: allUsersError } = (await supabase.from("profiles").select("*")) as {
    data: User[] | null
    error: any
  }

  if (serversError || proxiesError || seedEmailsError || rdpsError || dailyRevenuesError || allUsersError) {
    console.error("Error fetching mailer resources:", {
      serversError,
      proxiesError,
      seedEmailsError,
      rdpsError,
      dailyRevenuesError,
      allUsersError,
    })
    redirect("/dashboard")
  }

  return (
    <MailerResourcesClientPage
      currentUser={currentUserProfile}
      allUsers={allUsers || []}
      initialServers={servers || []}
      initialProxies={proxies || []}
      initialSeedEmails={seedEmails || []}
      initialRdps={rdps || []}
      dailyRevenues={dailyRevenues || []}
    />
  )
}
