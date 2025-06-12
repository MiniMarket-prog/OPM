"use client"
import type React from "react" // Add this import
import type { User } from "@/lib/types" // Assuming User type is defined here
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type UserRoleSimulatorProps = {
  currentUser: User | null
  allUsers: User[]
  onUserChange: (userId: string) => void
  className?: string
}

// Modify the component definition to use React.FC
export const UserRoleSimulator: React.FC<UserRoleSimulatorProps> = ({
  currentUser,
  allUsers,
  onUserChange,
  className,
}) => {
  // ... rest of the component implementation remains the same
  if (!currentUser) {
    return (
      <div className={cn("p-4 border rounded-md bg-muted text-muted-foreground", className)}>Loading user data...</div>
    )
  }

  const handleUserSelect = (userId: string) => {
    if (userId === "current") {
      // Potentially handle a "revert to actual logged-in user" if needed,
      // though typically the page would reload to the actual user state.
      // For now, if 'current' is selected and it's already the current user, do nothing.
      if (currentUser?.id !== userId) {
        // This condition might need adjustment based on how "current" is handled
        onUserChange(userId) // Or a specific ID representing the actual logged-in user
      }
    } else {
      onUserChange(userId)
    }
  }

  return (
    <div className={cn("p-4 border rounded-md bg-card shadow", className)}>
      <Label htmlFor="user-simulator-select" className="block text-sm font-medium text-muted-foreground mb-1">
        Simulate User View (Dev Tool)
      </Label>
      <Select
        value={currentUser.id || ""} // Ensure value is always a string
        onValueChange={handleUserSelect}
      >
        <SelectTrigger id="user-simulator-select" className="w-full md:w-[280px]">
          <SelectValue placeholder="Select a user to simulate" />
        </SelectTrigger>
        <SelectContent>
          {/* Optional: Add an item to represent the actual logged-in user if different from simulated */}
          {/* <SelectItem value="current">Current Logged-in User</SelectItem> */}
          {allUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentUser && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Currently viewing as: {currentUser.name || currentUser.email}</p>
          <p>Role: {currentUser.role}</p>
          {currentUser.team_id && <p>Team ID: {currentUser.team_id}</p>}
        </div>
      )}
    </div>
  )
}
