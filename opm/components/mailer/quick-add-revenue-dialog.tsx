"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useActionState } from "react"
import { toast } from "sonner"
import { addDailyRevenue } from "@/app/(dashboard)/mailer/resources/actions"
import type { DailyRevenue } from "@/lib/types"

interface QuickAddRevenueDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mailerId: string
  teamId: string
  onRevenueLogged: (revenue: DailyRevenue) => void
}

type FormState<T = any> = {
  success?: string
  error?: string
  partialErrors?: string[]
  data?: T
}
const initialFormState: FormState = {}

const getFormattedDate = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

export function QuickAddRevenueDialog({
  isOpen,
  onOpenChange,
  mailerId,
  teamId,
  onRevenueLogged,
}: QuickAddRevenueDialogProps) {
  const [revenueDate, setRevenueDate] = useState(getFormattedDate(0)) // Default to today
  const addRevenueFormRef = useRef<HTMLFormElement>(null)

  const boundAddDailyRevenue = (prevState: FormState<DailyRevenue>, formData: FormData) =>
    addDailyRevenue(formData.get("date") as string, Number(formData.get("amount")), mailerId, teamId)
  const [revenueFormState, revenueFormAction] = useActionState(boundAddDailyRevenue, initialFormState)

  useEffect(() => {
    if (revenueFormState.success) {
      toast.success(revenueFormState.success)
      if (revenueFormState.data) {
        onRevenueLogged(revenueFormState.data)
      }
      addRevenueFormRef.current?.reset()
      setRevenueDate(getFormattedDate(0)) // Reset to today after successful submission
      onOpenChange(false) // Close dialog on success
    }
    if (revenueFormState.error) {
      toast.error("Revenue Error", { description: revenueFormState.error })
    }
  }, [revenueFormState, onRevenueLogged, onOpenChange])

  // Reset date when dialog opens/closes to ensure it's always today's date
  useEffect(() => {
    if (isOpen) {
      setRevenueDate(getFormattedDate(0))
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quick Log Daily Revenue</DialogTitle>
          <DialogDescription>
            Enter the revenue for the selected date. This will update or add an entry.
          </DialogDescription>
        </DialogHeader>
        <form action={revenueFormAction} ref={addRevenueFormRef} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="revenue-date-quick" className="text-right">
              Date
            </Label>
            <Input
              type="date"
              id="revenue-date-quick"
              name="date"
              value={revenueDate}
              onChange={(e) => setRevenueDate(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="revenue-amount-quick" className="text-right">
              Amount ($)
            </Label>
            <Input
              type="number"
              id="revenue-amount-quick"
              name="amount"
              step="0.01"
              min="0"
              required
              placeholder="e.g., 123.45"
              className="col-span-3"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Log Revenue</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
