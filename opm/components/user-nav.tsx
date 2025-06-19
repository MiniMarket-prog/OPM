"use client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User as AuthUser } from "@supabase/supabase-js" // Import Supabase User type
import type { User } from "@/lib/types" // Import your custom User type
import { signOut as logout } from "@/app/auth/actions"
import Link from "next/link"

// Define the props interface for UserNav
interface UserNavProps {
  user: AuthUser // Supabase Auth User
  profile: User // Your custom User profile from the database
}

export function UserNav({ user, profile }: UserNavProps) {
  // Removed useMockDB and mockCurrentUser logic

  const currentUserRole = profile.role // Use the actual profile role
  const currentUserName = profile.full_name || profile.username || user.email || "User"
  const currentUserEmail = profile.email || user.email || "user@example.com"
  const currentUserAvatar = profile.avatar_url || "/abstract-logo.png" // Use actual avatar or placeholder

  // Function to determine the correct profile page based on role
  const getProfileHref = (role?: string | null) => {
    // role can be string | null from profile
    if (role === "mailer") return "/mailer/profile"
    if (role === "team-leader") return "/team-leader/profile"
    // Default to dashboard or a generic profile page if no specific role match
    return "/dashboard"
  }

  // Helper to get initials for AvatarFallback
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    const parts = name.split(" ")
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUserAvatar || "/placeholder.svg"} alt="User Avatar" />
            <AvatarFallback>{getInitials(currentUserName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUserName}</p>
            <p className="text-xs leading-none text-muted-foreground">{currentUserEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={getProfileHref(currentUserRole)}>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          {/* Assuming "New Team" is an admin/team-leader specific action */}
          {(currentUserRole === "admin" || currentUserRole === "team-leader") && (
            <DropdownMenuItem>New Team</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={logout} className="w-full">
            <button type="submit" className="w-full text-left">
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
