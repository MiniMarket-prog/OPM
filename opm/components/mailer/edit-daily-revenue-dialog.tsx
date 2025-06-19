"use client"

import { useState, useEffect, useActionState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { DailyRevenue } from "@/lib/types"
import { updateDailyRevenue } from "@/app/(dashboard)/mailer/resources/actions"

interface EditDailyRevenueDialogProps {
  dailyRevenue: DailyRevenue
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onRevenueUpdated: (updatedRevenue: DailyRevenue) => void
}

type FormState<T = any> = {
  success?: string
  error?: string
  data?: T
}
const initialFormState: FormState = {}

export function EditDailyRevenueDialog({
  dailyRevenue,
  isOpen,
  onOpenChange,
  onRevenueUpdated,
}: EditDailyRevenueDialogProps) {
  const [date, setDate] = useState(dailyRevenue.date)
  const [amount, setAmount] = useState(dailyRevenue.amount.toString())

  const boundUpdateDailyRevenue = (prevState: FormState<DailyRevenue>, formData: FormData) =>
    updateDailyRevenue(dailyRevenue.id, formData.get("date") as string, Number(formData.get("amount")))

  const [formState, formAction] = useActionState(boundUpdateDailyRevenue, initialFormState)

  useEffect(() => {
    if (formState.success) {
      toast.success(formState.success)
      if (formState.data) {
        onRevenueUpdated(formState.data)
      }
      onOpenChange(false) // Close dialog on success
    }
    if (formState.error) {
      toast.error("Failed to update revenue", { description: formState.error })
    }
  }, [formState, onRevenueUpdated, onOpenChange])

  useEffect(() => {
    // Reset form fields when dialog opens with a new dailyRevenue or closes
    if (isOpen) {
      setDate(dailyRevenue.date)
      setAmount(dailyRevenue.amount.toString())
    }
  }, [isOpen, dailyRevenue])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Daily Revenue</DialogTitle>
          <DialogDescription>Make changes to this daily revenue entry. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="date" className="text-right">
              Date
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right">
              Amount ($)
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
