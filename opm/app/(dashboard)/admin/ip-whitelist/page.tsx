import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@/lib/types"
import { IpWhitelistClientPage } from "./ip-whitelist-client-page"
import type { CookieOptions } from "@supabase/ssr"

export interface AllowedIp {
  id: string
  ip_address: string
  description?: string | null
  created_at: string
  added_by_admin_id?: string | null
  admin_name?: string | null // For display
}

async function getIpWhitelistData() {
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
    // Using any for item to ensure type compatibility for item.profiles
    let adminName = "Unknown Admin"
    // Check if item.profiles exists and is an array with at least one element
    if (item.profiles && Array.isArray(item.profiles) && item.profiles.length > 0) {
      adminName = item.profiles[0]?.name || "Unknown Admin"
    }
    // Fallback for if item.profiles is an object (which is expected for many-to-one)
    else if (item.profiles && typeof item.profiles === "object" && !Array.isArray(item.profiles)) {
      adminName = (item.profiles as { name?: string | null })?.name || "Unknown Admin"
    }

    return {
      id: item.id,
      ip_address: item.ip_address,
      description: item.description,
      created_at: item.created_at,
      added_by_admin_id: item.added_by_admin_id,
      admin_name: adminName, // Use the resolved adminName
    }
  })

  return { allowedIps, currentAdmin: profile as User }
}

export default async function AdminIpWhitelistPage() {
  const { allowedIps, currentAdmin } = await getIpWhitelistData()
  return <IpWhitelistClientPage initialAllowedIps={allowedIps} currentAdminId={currentAdmin.id} />
}
