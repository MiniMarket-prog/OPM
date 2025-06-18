import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MailerResourcesClientPage from "./mailer-resources-client-page"

export default async function MailerResourcesPage() {
  // Await the createSupabaseServerClient call
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
    .select("*, teams(*)")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "mailer" || !profile.team_id) {
    // Redirect if not a mailer, or no profile/team_id
    // The client component will handle the "Access Denied" message
    // if the user is logged in but doesn't meet the role/team criteria.
    // For now, we'll just pass the profile and let the client component decide.
    // If no profile, it's a hard redirect to login.
    if (!profile) {
      redirect("/login")
    }
  }

  const { data: servers, error: serversError } = await supabase
    .from("servers")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })

  const { data: proxies, error: proxiesError } = await supabase
    .from("proxies")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })

  const { data: seedEmails, error: seedEmailsError } = await supabase
    .from("seed_emails")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })

  const { data: rdps, error: rdpsError } = await supabase
    .from("rdps")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })

  const { data: dailyRevenues, error: dailyRevenuesError } = await supabase
    .from("daily_revenues")
    .select("*")
    .eq("mailer_id", user.id)
    .order("date", { ascending: false })

  const { data: allUsers, error: allUsersError } = await supabase.from("profiles").select("*")

  if (serversError || proxiesError || seedEmailsError || rdpsError || dailyRevenuesError || allUsersError) {
    console.error("Error fetching mailer resources:", {
      serversError,
      proxiesError,
      seedEmailsError,
      rdpsError,
      dailyRevenuesError,
      allUsersError,
    })
    // Handle error appropriately, maybe redirect to an error page or show a message
    redirect("/dashboard") // Redirect to dashboard on data fetch error
  }

  return (
    <MailerResourcesClientPage
      currentUser={profile!}
      allUsers={allUsers || []}
      initialServers={servers || []}
      initialProxies={proxies || []}
      initialSeedEmails={seedEmails || []}
      initialRdps={rdps || []}
      dailyRevenues={dailyRevenues || []}
    />
  )
}
