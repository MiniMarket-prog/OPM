"use client"
import { useState, useTransition } from "react"
import type { PendingUser } from "./page"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, UserCheck, Building, Clock } from "lucide-react"
import Link from "next/link"
import { approveUser, denyUser } from "./actions"
import { toast } from "sonner"

interface UserApprovalClientPageProps {
  initialPendingUsers: PendingUser[]
}

export function UserApprovalClientPage({ initialPendingUsers }: UserApprovalClientPageProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(initialPendingUsers)
  const [isPending, startTransition] = useTransition()

  const handleApprove = (userId: string) => {
    startTransition(async () => {
      const result = await approveUser(userId)
      if (result?.error) {
        toast.error("Failed to approve user", { description: result.error })
      } else {
        toast.success("User approved successfully!")
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId))
      }
    })
  }

  const handleDeny = (userId: string) => {
    if (!confirm("Are you sure you want to deny and delete this user? This action cannot be undone.")) {
      return
    }
    startTransition(async () => {
      const result = await denyUser(userId)
      if (result?.error) {
        toast.error("Failed to deny user", { description: result.error })
      } else {
        toast.success("User denied and deleted.")
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId))
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCheck className="h-8 w-8" /> User Approval Requests
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Accounts</CardTitle>
          <CardDescription>
            {pendingUsers.length > 0
              ? `There are ${pendingUsers.length} user(s) awaiting approval. Approved users will be assigned the 'mailer' role.`
              : "There are no pending user approval requests at this time."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Requested On
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                        disabled={isPending}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeny(user.id)} disabled={isPending}>
                        <X className="mr-2 h-4 w-4" /> Deny
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending requests.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserApprovalClientPage
