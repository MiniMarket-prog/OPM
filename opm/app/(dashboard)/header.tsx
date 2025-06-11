import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { User, UserRole } from "@/lib/types"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRoleSimulator } from "@/components/user-role-simulator"

async function getUserData() {
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
  if (!authUser) return { user: null, allUsers: [] }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
  const { data: allProfiles } = await supabase.from("profiles").select("id, name, role, team_id, email")

  const user: User | null = profile
    ? {
        id: profile.id,
        name: profile.name || "User",
        email: authUser.email,
        role: profile.role as UserRole,
        team_id: profile.team_id,
        avatar_url: profile.avatar_url,
      }
    : null

  const allUsers: User[] = (allProfiles || []).map((p) => ({
    id: p.id,
    name: p.name || "User",
    role: p.role as UserRole,
    team_id: p.team_id,
    email: p.email,
  }))

  return { user, allUsers }
}

export async function Header() {
  const { user, allUsers } = await getUserData()

  if (!user) {
    return null // Or a login button
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/abstract-logo.png" alt="App Logo" />
              <AvatarFallback>BEO</AvatarFallback>
            </Avatar>
            <span className="hidden font-bold sm:inline-block">Bulk Email Org</span>
          </Link>
          <MainNav userRole={user.role} />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserRoleSimulator currentUser={user} allUsers={allUsers} />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
