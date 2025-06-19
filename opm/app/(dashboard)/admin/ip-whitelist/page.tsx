import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User } from "@/lib/types"
import { IpWhitelistClientPage } from "./ip-whitelist-client-page"
// Removed CookieOptions import as it's no longer needed here

export interface AllowedIp {
  id: string
  ip_address: string
  description?: string | null
  created_at: string | null // This was already corrected, keeping it.
  added_by_admin_id?: string | null
  admin_name?: string | null // For display
}

async function getIpWhitelistData() {
  // Await the Supabase client creation, and call without arguments
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, id, name") // Fetch admin name for display
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch IPs and join with profiles to get admin name
  const { data: ipsData, error: ipsError } = await supabase
    .from("allowed_signup_ips")
    .select(`
      id,
      ip_address,
      description,
      created_at,
      added_by_admin_id,
      profiles ( name )
    `)
    .order("created_at", { ascending: false })

  if (ipsError) {
    console.error("Error fetching IP whitelist:", ipsError)
    return { allowedIps: [], currentAdmin: profile as User }
  }

  const allowedIps: AllowedIp[] = (ipsData || []).map((item: any) => {
    let adminName = "Unknown Admin"
    if (item.profiles && typeof item.profiles === "object" && !Array.isArray(item.profiles)) {
      adminName = (item.profiles as { name?: string | null })?.name || "Unknown Admin"
    }

    return {
      id: item.id,
      ip_address: item.ip_address,
      description: item.description,
      created_at: item.created_at,
      added_by_admin_id: item.added_by_admin_id,
      admin_name: adminName,
    }
  })

  return { allowedIps, currentAdmin: profile as User }
}

export default async function AdminIpWhitelistPage() {
  const { allowedIps, currentAdmin } = await getIpWhitelistData()
  return <IpWhitelistClientPage initialAllowedIps={allowedIps} currentAdminId={currentAdmin.id} />
}
