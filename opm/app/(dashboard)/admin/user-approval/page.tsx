import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@/lib/types" // Assuming User has id, name, email, role
import { UserApprovalClientPage } from "./user-approval-client-page"
import type { CookieOptions } from "@supabase/ssr"

export interface PendingUser extends User {
  created_at: string
}

async function getPendingUsers() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Ignored */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        /* Ignored */
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
    .select("role")
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    console.error("User is not admin or profile error:", profileError)
    redirect("/dashboard")
  }

  // Call the RPC function
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_pending_approval_users")

  if (rpcError) {
    console.error("Error fetching pending users via RPC:", rpcError)
    console.error(JSON.stringify(rpcError, null, 2))
    return []
  }

  // Map the data from RPC to the PendingUser structure
  const pendingUsers: PendingUser[] = (rpcData || []).map((item: any) => ({
    id: item.profile_id,
    name: item.profile_name || item.profile_email, // Use profile_name, fallback to email
    email: item.profile_email,
    role: item.profile_role,
    created_at: item.user_created_at,
  }))

  return pendingUsers
}

export default async function UserApprovalPage() {
  const pendingUsers = await getPendingUsers()
  return <UserApprovalClientPage initialPendingUsers={pendingUsers} />
}
