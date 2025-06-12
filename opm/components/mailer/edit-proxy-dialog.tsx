"use client"
import { useState, useEffect } from "react"
import type { ProxyItem } from "@/lib/types"
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
import { updateProxy } from "@/app/(dashboard)/mailer/resources/actions"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface EditProxyDialogProps {
  proxy: ProxyItem | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onProxyUpdated: (updatedProxy: ProxyItem) => void
}

type ProxyFormState = {
  error?: string
  success?: string
  data?: ProxyItem
}
const initialProxyFormState: ProxyFormState = {}

export function EditProxyDialog({ proxy, isOpen, onOpenChange, onProxyUpdated }: EditProxyDialogProps) {
  const [proxyString, setProxyString] = useState("")
  const [status, setStatus] = useState<ProxyItem["status"]>("active")

  useEffect(() => {
    if (proxy) {
      setProxyString(proxy.proxy_string)
      setStatus(proxy.status)
    }
  }, [proxy])

  const [formState, formAction, isPending] = useActionState(async (prevState: ProxyFormState, formData: FormData) => {
    if (!proxy) return { error: "No proxy selected for update." }
    const newProxyString = formData.get("proxyString") as string
    const newStatus = formData.get("status") as ProxyItem["status"]

    const result = await updateProxy(proxy.id, {
      proxy_string: newProxyString,
      status: newStatus,
    })
    return result
  }, initialProxyFormState)

  useEffect(() => {
    if (formState.success && formState.data) {
      toast.success(formState.success)
      onProxyUpdated(formState.data)
      onOpenChange(false) // Close dialog on success
    } else if (formState.error) {
      toast.error("Update failed", { description: formState.error })
    }
  }, [formState, onProxyUpdated, onOpenChange])

  if (!proxy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Proxy</DialogTitle>
          <DialogDescription>Make changes to proxy details. Click save when done.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-proxyString" className="text-right">
                Proxy String
              </Label>
              <Input
                id="edit-proxyString"
                name="proxyString"
                value={proxyString}
                onChange={(e) => setProxyString(e.target.value)}
                className="col-span-3"
                placeholder="ip:port:user:pass"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-proxy-status" className="text-right">
                Status
              </Label>
              <Select name="status" value={status} onValueChange={(value) => setStatus(value as ProxyItem["status"])}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
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
