"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTeam } from "@/app/(dashboard)/admin/teams/actions"
import { toast } from "sonner"

interface EditTeamDialogProps {
  team: Team | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onTeamUpdated: (updatedTeam: Team) => void
}

export function EditTeamDialog({ team, isOpen, onOpenChange, onTeamUpdated }: EditTeamDialogProps) {
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (team) {
      setName(team.name)
    }
  }, [team])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!team || !name.trim()) {
      toast.error("Team name cannot be empty.")
      return
    }

    const formData = new FormData()
    formData.append("teamId", team.id)
    formData.append("newName", name.trim())

    startTransition(async () => {
      const result = await updateTeam(formData)
      if (result?.error) {
        toast.error("Failed to update team", { description: result.error })
      } else if (result?.success && result.updatedTeam) {
        toast.success(result.message || "Team updated successfully!")
        onTeamUpdated(result.updatedTeam)
        onOpenChange(false)
      } else {
        toast.error("Failed to update team", { description: "An unexpected error occurred." })
      }
    })
  }

  if (!team) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team: {team.name}</DialogTitle>
          <DialogDescription>Make changes to the team name. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-team-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-team-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="col-span-3"
                disabled={isPending}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
