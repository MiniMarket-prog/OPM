"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCog } from "lucide-react"
import type { User } from "@/lib/types"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface UserRoleSimulatorProps {
  currentUser: User | undefined
  allUsers: User[]
  className?: string
}

export function UserRoleSimulator({ currentUser, allUsers, className }: UserRoleSimulatorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!currentUser) return null

  const handleUserChange = (userId: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set("simulatedUserId", userId)
    const search = current.toString()
    const query = search ? `?${search}` : ""
    router.push(`${pathname}${query}`)
    router.refresh() // Refresh to ensure server components re-render with new user
  }

  return (
    <div className={`hidden lg:flex items-center gap-2 ${className}`}>
      <UserCog className="h-5 w-5 text-muted-foreground" />
      <Select value={currentUser.id} onValueChange={handleUserChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Simulate User Role" />
        </SelectTrigger>
        <SelectContent>
          {allUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.role}) {user.team_id ? `(Team: ${user.team_id.substring(0, 6)})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
