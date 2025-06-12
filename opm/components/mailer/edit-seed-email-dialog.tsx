"use client"
import { useState, useEffect } from "react"
import type { SeedEmail } from "@/lib/types"
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
import { updateSeedEmail } from "@/app/(dashboard)/mailer/resources/actions"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface EditSeedEmailDialogProps {
  seedEmail: SeedEmail | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSeedEmailUpdated: (updatedSeedEmail: SeedEmail) => void
}

type SeedEmailFormState = {
  error?: string
  success?: string
  data?: SeedEmail
}
const initialSeedEmailFormState: SeedEmailFormState = {}

export function EditSeedEmailDialog({ seedEmail, isOpen, onOpenChange, onSeedEmailUpdated }: EditSeedEmailDialogProps) {
  const [emailAddress, setEmailAddress] = useState("")
  const [passwordAlias, setPasswordAlias] = useState("")
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [isp, setIsp] = useState("")
  const [status, setStatus] = useState<SeedEmail["status"]>("active")
  const [groupName, setGroupName] = useState("")

  useEffect(() => {
    if (seedEmail) {
      setEmailAddress(seedEmail.email_address)
      setPasswordAlias(seedEmail.password_alias)
      setRecoveryEmail(seedEmail.recovery_email || "")
      setIsp(seedEmail.isp)
      setStatus(seedEmail.status)
      setGroupName(seedEmail.group_name || "")
    }
  }, [seedEmail])

  const [formState, formAction, isPending] = useActionState(
    async (prevState: SeedEmailFormState, formData: FormData) => {
      if (!seedEmail) return { error: "No seed email selected for update." }
      const newEmailAddress = formData.get("emailAddress") as string
      const newPasswordAlias = formData.get("passwordAlias") as string
      const newRecoveryEmail = formData.get("recoveryEmail") as string
      const newIsp = formData.get("isp") as string
      const newStatus = formData.get("status") as SeedEmail["status"]
      const newGroupName = formData.get("groupName") as string

      const result = await updateSeedEmail(seedEmail.id, {
        email_address: newEmailAddress,
        password_alias: newPasswordAlias,
        recovery_email: newRecoveryEmail || undefined, // Handle empty string
        isp: newIsp,
        status: newStatus,
        group_name: newGroupName || undefined, // ADDED
      })
      return result
    },
    initialSeedEmailFormState,
  )

  useEffect(() => {
    if (formState.success && formState.data) {
      toast.success(formState.success)
      onSeedEmailUpdated(formState.data)
      onOpenChange(false) // Close dialog on success
    } else if (formState.error) {
      toast.error("Update failed", { description: formState.error })
    }
  }, [formState, onSeedEmailUpdated, onOpenChange])

  if (!seedEmail) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Seed Email</DialogTitle>
          <DialogDescription>Make changes to seed email details. Click save when done.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-emailAddress" className="text-right">
                Email
              </Label>
              <Input
                id="edit-emailAddress"
                name="emailAddress"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-passwordAlias" className="text-right">
                Password Alias
              </Label>
              <Input
                id="edit-passwordAlias"
                name="passwordAlias"
                value={passwordAlias}
                onChange={(e) => setPasswordAlias(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-recoveryEmail" className="text-right">
                Recovery Email
              </Label>
              <Input
                id="edit-recoveryEmail"
                name="recoveryEmail"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isp" className="text-right">
                ISP
              </Label>
              <Input
                id="edit-isp"
                name="isp"
                value={isp}
                onChange={(e) => setIsp(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-groupName" className="text-right">
                Group Name
              </Label>
              <Input
                id="edit-groupName"
                name="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
            {seedEmail?.entry_date && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Entry Date</Label>
                <p className="col-span-3 text-sm text-muted-foreground pt-2">
                  {new Date(seedEmail.entry_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-seed-status" className="text-right">
                Status
              </Label>
              <Select name="status" value={status} onValueChange={(value) => setStatus(value as SeedEmail["status"])}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="warmup">Warmup</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="cooldown">Cooldown</SelectItem>
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
