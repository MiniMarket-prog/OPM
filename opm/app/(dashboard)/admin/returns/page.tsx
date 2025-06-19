import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminReturnsClientPage from "./admin-returns-client-page"
import type { Server, User } from "@/lib/types" // Import necessary types, including User

export default async function AdminReturnsPage() {
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
    .select("role, teams!fk_profiles_team_id(*)") // Select role and joined team data
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    console.error("AdminReturnsPage: User not authorized or profile not found.", profileError)
    redirect("/dashboard") // Redirect if not an admin
  }

  // Fetch servers with status 'returned'
  const { data: returnedServers, error: returnedServersError } = await supabase
    .from("servers")
    // CRITICAL CHANGE: Select full_name, name, and username from profiles
    .select("*, profiles!servers_added_by_mailer_id_fkey(full_name, name, username)")
    .eq("status", "returned")
    .order("updated_at", { ascending: false })

  // Fetch servers with status 'pending_return_approval'
  const { data: pendingServers, error: pendingServersError } = await supabase
    .from("servers")
    // CRITICAL CHANGE: Select full_name, name, and username from profiles
    .select("*, profiles!servers_added_by_mailer_id_fkey(full_name, name, username)")
    .eq("status", "pending_return_approval")
    .order("updated_at", { ascending: false })

  if (returnedServersError || pendingServersError) {
    console.error("Error fetching admin server returns:", { returnedServersError, pendingServersError })
    redirect("/dashboard")
  }

  // CRITICAL CHANGE: Explicitly type the profiles object in the assertion
  const typedReturnedServers: (Server & { profiles: Pick<User, "full_name" | "name" | "username"> | null })[] =
    returnedServers || []
  const typedPendingServers: (Server & { profiles: Pick<User, "full_name" | "name" | "username"> | null })[] =
    pendingServers || []

  return (
    <AdminReturnsClientPage initialReturnedServers={typedReturnedServers} initialPendingServers={typedPendingServers} />
  )
}
