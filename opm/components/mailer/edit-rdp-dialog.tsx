"use client"
import { useEffect, useActionState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Rdp } from "@/lib/types"
import { updateRdp } from "@/app/(dashboard)/mailer/resources/actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditRdpDialogProps {
  rdp: Rdp
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onRdpUpdated: (updatedRdp: Rdp) => void
}

type FormState = {
  success?: string
  error?: string
  data?: Rdp // Add this line
}

const initialFormState: FormState = {}

export function EditRdpDialog({ rdp, isOpen, onOpenChange, onRdpUpdated }: EditRdpDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const boundUpdateRdp = async (prevState: FormState, formData: FormData) => {
    const ip_address = formData.get("ip_address") as string
    const username = formData.get("username") as string
    const password_alias = formData.get("password_alias") as string
    const entry_date = formData.get("entry_date") as string
    const status = formData.get("status") as Rdp["status"]

    return updateRdp(rdp.id, { ip_address, username, password_alias, entry_date, status })
  }

  const [formState, formAction, isPending] = useActionState(boundUpdateRdp, initialFormState)

  useEffect(() => {
    if (formState.success) {
      toast.success("RDP updated successfully!")
      if (formState.data) {
        onRdpUpdated(formState.data as Rdp)
      }
      onOpenChange(false)
    }
    if (formState.error) {
      toast.error("Failed to update RDP", { description: formState.error })
    }
  }, [formState, onOpenChange, onRdpUpdated])

  useEffect(() => {
    if (isOpen) {
      // Reset form state when dialog opens with new rdp data
      // This is important if an error occurred on a previous open or if rdp object changes.
      formRef.current?.reset()
    }
  }, [isOpen, rdp])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit RDP</DialogTitle>
          <DialogDescription>Make changes to your RDP here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ip_address" className="text-right">
              IP Address
            </Label>
            <Input id="ip_address" name="ip_address" defaultValue={rdp.ip_address} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" name="username" defaultValue={rdp.username} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password_alias" className="text-right">
              Password Alias
            </Label>
            <Input
              id="password_alias"
              name="password_alias"
              defaultValue={rdp.password_alias}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entry_date" className="text-right">
              Entry Date
            </Label>
            <Input
              type="date"
              id="entry_date"
              name="entry_date"
              defaultValue={rdp.entry_date || ""} // Use current date if not set, or empty string
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select name="status" defaultValue={rdp.status} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
