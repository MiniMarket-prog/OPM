"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { UserRoleSimulator } from "@/components/user-role-simulator"
import { UserPlus, Users, Building, KeyRound } from "lucide-react"
import Link from "next/link"
import { createMailer } from "./actions" // Action path is correct for this file structure
import { toast } from "sonner"

interface TeamLeaderMailersClientPageProps {
  currentUser: User
  teamName: string
  initialTeamMailers: User[]
  allUsersForSimulator: User[]
}

export function TeamLeaderMailersClientPage({
  currentUser,
  teamName,
  initialTeamMailers,
  allUsersForSimulator,
}: TeamLeaderMailersClientPageProps) {
  const [teamMailers, setTeamMailers] = useState<User[]>(initialTeamMailers)
  const [newMailerName, setNewMailerName] = useState("")
  const [newMailerEmail, setNewMailerEmail] = useState("")
  const [newMailerPassword, setNewMailerPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  // This effect ensures that if the props update (e.g. after revalidation), the local state updates.
  useEffect(() => {
    setTeamMailers(initialTeamMailers)
  }, [initialTeamMailers])

  // The primary access check is now done on the server component.
  // We can keep a fallback or remove if server handles all redirection.
  if (!currentUser || currentUser.role !== "team-leader" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4">
        <UserRoleSimulator currentUser={currentUser} allUsers={allUsersForSimulator} className="mb-4" />
        <p>Access Denied. You must be a Team Leader with an assigned team to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const handleCreateMailer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newMailerName.trim() || !newMailerEmail.trim() || !newMailerPassword.trim()) {
      toast.error("Mailer name, email, and password cannot be empty.")
      return
    }
    if (newMailerPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return
    }

    const formData = new FormData()
    formData.append("mailerName", newMailerName.trim())
    formData.append("mailerEmail", newMailerEmail.trim())
    formData.append("mailerPassword", newMailerPassword.trim())
    formData.append("teamId", currentUser.team_id!)

    startTransition(async () => {
      const result = await createMailer(formData)
      if (result?.error) {
        toast.error("Failed to create Mailer", { description: result.error })
      } else if (result?.success && result.newMailer) {
        toast.success(result.message || "Mailer created successfully!")
        // Optimistic update
        const mailerToAdd: User = {
          id: result.newMailer.id,
          name: result.newMailer.name || "N/A",
          email: result.newMailer.email || "N/A", // Ensure email is part of the returned profile
          role: "mailer",
          team_id: result.newMailer.team_id,
        }
        setTeamMailers((prev) => [...prev, mailerToAdd])
        setNewMailerName("")
        setNewMailerEmail("")
        setNewMailerPassword("")
      } else if (result?.success) {
        // Fallback if newMailer is not returned, rely on revalidation
        toast.success(result.message || "Mailer created successfully! Refreshing data...")
        setNewMailerName("")
        setNewMailerEmail("")
        setNewMailerPassword("")
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UserRoleSimulator currentUser={currentUser} allUsers={allUsersForSimulator} className="mb-6" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Mailers for Team: {teamName}</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              Create New Mailer
            </CardTitle>
            <CardDescription>Add a new mailer to your team: {teamName}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMailer} className="space-y-4">
              <div>
                <Label htmlFor="newMailerName">Mailer Name</Label>
                <Input
                  id="newMailerName"
                  name="newMailerName"
                  type="text"
                  value={newMailerName}
                  onChange={(e) => setNewMailerName(e.target.value)}
                  placeholder="e.g., Bob The Mailer"
                  disabled={isPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newMailerEmail">Mailer Email</Label>
                <Input
                  id="newMailerEmail"
                  name="newMailerEmail"
                  type="email"
                  value={newMailerEmail}
                  onChange={(e) => setNewMailerEmail(e.target.value)}
                  placeholder="e.g., bob@example.com"
                  disabled={isPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newMailerPassword" className="flex items-center gap-1">
                  <KeyRound className="h-4 w-4" /> Temporary Password
                </Label>
                <Input
                  id="newMailerPassword"
                  name="newMailerPassword"
                  type="password"
                  value={newMailerPassword}
                  onChange={(e) => setNewMailerPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  disabled={isPending}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The new Mailer should change this password upon first login.
                </p>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating Mailer..." : "Create Mailer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Mailers in Your Team
            </CardTitle>
            <CardDescription>Total Mailers: {teamMailers.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMailers.length === 0 ? (
              <p>No mailers created in this team yet.</p>
            ) : (
              <ul className="space-y-2">
                {teamMailers.map((mailer: User) => (
                  <li key={mailer.id} className="p-2 border rounded-md text-sm">
                    {mailer.name} ({mailer.email})
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TeamLeaderMailersClientPage
