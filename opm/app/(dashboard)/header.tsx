import { UserNav } from "@/components/user-nav"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Header() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // CRITICAL CHANGE: Select all profile fields to ensure compatibility with UserNav's expected props
  const { data: profile } = await supabase
    .from("profiles")
    .select("*") // Changed from select("id, username, full_name, avatar_url, role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    console.error("Profile not found for user:", user.id)
    redirect("/login")
  }

  // userRole is still determined but not passed to MainNav as it's removed
  // const userRole: UserRole = profile.role as UserRole; // This line can be removed if UserRole is not used elsewhere in this file

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex h-16 items-center px-4">
        {/* MainNav component removed as per previous request */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Pass the full profile object to UserNav */}
          <UserNav user={user} profile={profile} />
        </div>
      </div>
    </header>
  )
}
