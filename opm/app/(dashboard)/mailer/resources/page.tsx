import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import MailerResourcesClientPage from "./mailer-resources-client-page"
import type { DailyRevenue, ProxyItem, Rdp, SeedEmail, Server, Team, User } from "@/lib/types"
import type { CookieOptions } from "@supabase/ssr"

export default async function MailerResourcesServerPage() {
  const cookieStore = await cookies()

  const supabase = createSupabaseServerClient({
    get: (name: string) => {
      return cookieStore.get(name)?.value
    },
    set: (name: string, value: string, options: CookieOptions) => {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        // Ignore error for Server Components
      }
    },
    remove: (name: string, options: CookieOptions) => {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        // Ignore error for Server Components
      }
    },
  })

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

  const { data: allUsersForSimulator } = await supabase.from("profiles").select("*")

  if (profileError || !profileData) {
    console.error("Error fetching mailer profile:", profileError?.message)
    const basicUser: User & { teams?: Team } = {
      id: user.id,
      email: user.email || "",
      role: "pending_approval",
      name: user.user_metadata?.full_name || user.email || "New User",
      team_id: null,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      avatar_url: user.user_metadata?.avatar_url,
      username: user.user_metadata?.user_name,
      teams: undefined,
    }
    return (
      <MailerResourcesClientPage
        currentUser={basicUser}
        allUsers={allUsersForSimulator || []}
        initialServers={[]}
        initialProxies={[]}
        initialSeedEmails={[]}
        initialRdps={[]}
        dailyRevenues={[]}
      />
    )
  }

  const typedProfile = profileData as User & { teams: Team }

  if (typedProfile.role !== "mailer" || !typedProfile.team_id) {
    return (
      <MailerResourcesClientPage
        currentUser={typedProfile}
        allUsers={allUsersForSimulator || []}
        initialServers={[]}
        initialProxies={[]}
        initialSeedEmails={[]}
        initialRdps={[]}
        dailyRevenues={[]}
      />
    )
  }

  const { data: serversData } = await supabase.from("servers").select("*").eq("added_by_mailer_id", user.id)
  const { data: seedEmailsData } = await supabase.from("seed_emails").select("*").eq("added_by_mailer_id", user.id)
  const { data: proxiesData } = await supabase.from("proxies").select("*").eq("added_by_mailer_id", user.id)
  const { data: rdpsData } = await supabase.from("rdps").select("*").eq("added_by_mailer_id", user.id)
  const { data: dailyRevenuesData } = await supabase
    .from("daily_revenue")
    .select("*")
    .eq("mailer_id", user.id)
    .order("date", { ascending: false })

  return (
    <MailerResourcesClientPage
      currentUser={typedProfile}
      allUsers={allUsersForSimulator || []}
      initialServers={(serversData as Server[]) || []}
      initialSeedEmails={(seedEmailsData as SeedEmail[]) || []}
      initialProxies={(proxiesData as ProxyItem[]) || []}
      initialRdps={(rdpsData as Rdp[]) || []}
      dailyRevenues={(dailyRevenuesData as DailyRevenue[]) || []}
    />
  )
}
