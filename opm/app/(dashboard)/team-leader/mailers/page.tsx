"use client"

import type React from "react"
import type { User, Team } from "@/lib/types"

import { useState, useTransition } from "react"
import { useMockDB } from "@/lib/mock-data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { UserRoleSimulator } from "@/components/user-role-simulator"
import { UserPlus, Users, Building, KeyRound } from "lucide-react"
import Link from "next/link"
import { createMailer } from "./actions"
import { toast } from "sonner"

export default function TLMailersPage() {
  const [db, { getCurrentUser }] = useMockDB()
  const firstTL = db.users.find((u: User) => u.role === "team-leader")
  const [selectedUserId, setSelectedUserId] = useState<string>(firstTL?.id || db.users[0]?.id || "")
  const currentUser = getCurrentUser(selectedUserId)

  const [newMailerName, setNewMailerName] = useState("")
  const [newMailerEmail, setNewMailerEmail] = useState("")
  const [newMailerPassword, setNewMailerPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  if (!currentUser || currentUser.role !== "team-leader" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4">
        <UserRoleSimulator
          currentUser={currentUser}
          allUsers={db.users}
          onUserChange={setSelectedUserId}
          className="mb-4"
        />
        <p>Access Denied. You must be a Team Leader with an assigned team to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }
  const currentTeam = db.teams.find((t: Team) => t.id === currentUser.team_id)

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
    formData.append("teamId", currentUser.team_id!) // team_id is checked in the guard clause

    startTransition(async () => {
      const result = await createMailer(formData)
      if (result?.error) {
        toast.error("Failed to create Mailer", { description: result.error })
      } else if (result?.success) {
        toast.success(result.message || "Mailer created successfully!")
        setNewMailerName("")
        setNewMailerEmail("")
        setNewMailerPassword("")
        // Re-fetching or optimistic update would go here if not relying on revalidatePath
        // For now, Supabase data will update on next page load or via revalidation
      }
    })
  }

  // This part still uses mockDB for display.
  // A full solution would fetch this from Supabase or update via revalidation.
  const mailersInTeam = db.users.filter((u: User) => u.role === "mailer" && u.team_id === currentUser.team_id)

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UserRoleSimulator
        currentUser={currentUser}
        allUsers={db.users}
        onUserChange={setSelectedUserId}
        className="mb-6"
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Mailers for Team: {currentTeam?.name || "N/A"}</h1>
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
            <CardDescription>Add a new mailer to your team: {currentTeam?.name || "N/A"}.</CardDescription>
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
            <CardDescription>Total Mailers: {mailersInTeam.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {mailersInTeam.length === 0 ? (
              <p>No mailers created in this team yet. (Display uses mock data for now)</p>
            ) : (
              <ul className="space-y-2">
                {mailersInTeam.map((mailer: User) => (
                  <li key={mailer.id} className="p-2 border rounded-md text-sm">
                    {mailer.name} ({mailer.email})
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Note: This list currently uses mock data and will update fully upon page refresh after a mailer is created
              with the new system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
