"use client"
import { useState, useEffect } from "react"
import type { Server as ServerType } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useActionState } from "react"
import { updateServer } from "@/app/(dashboard)/mailer/resources/actions"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface EditServerDialogProps {
  server: ServerType | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onServerUpdated: (updatedServer: ServerType) => void
}

type ServerFormState = {
  error?: string
  success?: string
  data?: ServerType
}
const initialServerFormState: ServerFormState = {}

export function EditServerDialog({ server, isOpen, onOpenChange, onServerUpdated }: EditServerDialogProps) {
  const [provider, setProvider] = useState("")
  const [ipAddress, setIpAddress] = useState("")
  const [status, setStatus] = useState<ServerType["status"]>("active")

  useEffect(() => {
    if (server) {
      setProvider(server.provider)
      setIpAddress(server.ip_address)
      setStatus(server.status)
    }
  }, [server])

  const [formState, formAction, isPending] = useActionState(async (prevState: ServerFormState, formData: FormData) => {
    if (!server) return { error: "No server selected for update." }
    const newProvider = formData.get("provider") as string
    const newIpAddress = formData.get("ipAddress") as string
    const newStatus = formData.get("status") as ServerType["status"]

    const result = await updateServer(server.id, {
      provider: newProvider,
      ip_address: newIpAddress,
      status: newStatus,
    })
    return result
  }, initialServerFormState)

  useEffect(() => {
    if (formState.success && formState.data) {
      toast.success(formState.success)
      onServerUpdated(formState.data)
      onOpenChange(false)
    } else if (formState.error) {
      toast.error("Update failed", { description: formState.error })
    }
  }, [formState, onServerUpdated, onOpenChange])

  if (!server) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>Make changes to server details. Click save when done.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-provider" className="text-right">
                Provider
              </Label>
              <Input
                id="edit-provider"
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ipAddress" className="text-right">
                IP Address
              </Label>
              <Input
                id="edit-ipAddress"
                name="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select name="status" value={status} onValueChange={(value) => setStatus(value as ServerType["status"])}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
