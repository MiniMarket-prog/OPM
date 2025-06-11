"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Server } from "@/lib/types" // Assuming this path is correct in your local setup
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
// Assuming useMockDB is correctly located, or you're transitioning to Supabase
import { useMockDB } from "@/lib/mock-data-store"
import { toast } from "sonner"

interface EditServerDialogProps {
  server: Server | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onServerUpdated: () => void // Callback to refresh list or state
}

export function EditServerDialog({ server, isOpen, onOpenChange, onServerUpdated }: EditServerDialogProps) {
  const [, { updateServer }] = useMockDB() // Or your Supabase update function
  const [provider, setProvider] = useState("")
  const [ipAddress, setIpAddress] = useState("")

  useEffect(() => {
    if (server) {
      setProvider(server.provider)
      setIpAddress(server.ip_address)
    }
  }, [server])

  const handleSubmit = () => {
    if (!server) return

    if (!provider.trim() || !ipAddress.trim()) {
      toast.error("Provider and IP Address cannot be empty.")
      return
    }

    // Replace with your actual update logic (e.g., Supabase call)
    const updatedServer = updateServer(server.id, { provider: provider.trim(), ip_address: ipAddress.trim() })

    if (updatedServer) {
      toast.success("Server details updated.")
      onServerUpdated()
      onOpenChange(false)
    } else {
      toast.error("Failed to update server.")
    }
  }

  if (!server) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>Make changes to the server details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-provider" className="text-right">
              Provider
            </Label>
            <Input
              id="edit-provider"
              value={provider}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProvider(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-ipAddress" className="text-right">
              IP Address
            </Label>
            <Input
              id="edit-ipAddress"
              value={ipAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIpAddress(e.target.value)}
              className="col-span-.3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
