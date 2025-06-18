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
import { useMockDB } from "@/lib/mock-data-store" // Assuming this is still used for mock user
import type { User } from "@/lib/types"
import { signOut as logout } from "@/app/auth/actions"
import Link from "next/link" // Assuming Link is used

export function UserNav() {
  const [db] = useMockDB()
  const mockCurrentUser = db.users.find((u) => u.role === "admin") || (db.users[0] as User | undefined)
  const currentUserRole = mockCurrentUser?.role

  // Function to determine the correct profile page based on role
  const getProfileHref = (role?: User["role"]) => {
    if (role === "mailer") return "/mailer/profile"
    if (role === "team-leader") return "/team-leader/profile"
    // Default to dashboard or a generic profile page if no specific role match
    return "/dashboard"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/abstract-logo.png" alt="User Avatar" /> {/* Using abstract-logo as a placeholder */}
            <AvatarFallback>{mockCurrentUser ? mockCurrentUser.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{mockCurrentUser?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{mockCurrentUser?.email || "user@example.com"}</p>
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
