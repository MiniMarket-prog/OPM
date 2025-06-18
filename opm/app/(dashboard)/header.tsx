import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/types"

export default async function Header() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    console.error("Profile not found for user:", user.id)
    redirect("/login")
  }

  const userRole: UserRole = profile.role as UserRole

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <MainNav className="mx-6" userRole={userRole} /> {/* Pass userRole here */}
        <div className="ml-auto flex items-center space-x-4">
          <UserNav user={user} profile={profile} /> {/* Pass the full profile */}
        </div>
      </div>
    </header>
  )
}
