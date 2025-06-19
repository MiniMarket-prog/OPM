import type React from "react"
import Header from "./header"
import { AppSidebar } from "@/components/app-sidebar" // Import AppSidebar
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User, Team } from "@/lib/types" // Import User and Team types
import { SidebarProvider } from "@/components/ui/sidebar" // Import SidebarProvider

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Fetch the user's profile with their team information
  const { data: currentUserProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*, teams!fk_profiles_team_id(*)") // Select all profile fields and join team data
    .eq("id", user.id)
    .single()

  if (profileError || !currentUserProfile) {
    console.error("DashboardLayout: Error fetching user profile or profile not found.", profileError)
    redirect("/login") // Redirect if profile cannot be fetched
  }

  // Ensure currentUserProfile is typed correctly for passing to client components
  const typedCurrentUser: User & { teams?: Team | null } = currentUserProfile as User & { teams?: Team | null }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      {/* Wrap AppSidebar and main content with SidebarProvider */}
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar currentUser={typedCurrentUser} /> {/* Pass currentUser to AppSidebar */}
          <main className="flex-1">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  )
}
