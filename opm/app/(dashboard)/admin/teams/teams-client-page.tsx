"use client"

import type React from "react"
import { useState, useTransition } from "react"
import type { User, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { PlusCircle, Users, Building, KeyRound } from "lucide-react"
import Link from "next/link"
import { createTeam, createTeamLeader } from "./actions" // Import the server actions
import { toast } from "sonner"

interface AdminTeamsClientPageProps {
  initialTeams: Team[]
  initialUsers: User[]
}

export function AdminTeamsClientPage({ initialTeams, initialUsers }: AdminTeamsClientPageProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [users, setUsers] = useState<User[]>(initialUsers)

  const [newTeamName, setNewTeamName] = useState("")
  const [isTeamPending, startTeamTransition] = useTransition()

  const [newTlName, setNewTlName] = useState("")
  const [newTlEmail, setNewTlEmail] = useState("")
  const [newTlPassword, setNewTlPassword] = useState("")
  const [assignTlToTeamId, setAssignTlToTeamId] = useState<string>(initialTeams[0]?.id || "")
  const [isTlPending, startTlTransition] = useTransition()

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTeamTransition(async () => {
      const result = await createTeam(formData)
      if (result?.error) {
        toast.error("Failed to create team", { description: result.error })
      } else if (result?.success) {
        toast.success(result.message || "Team created successfully!")
        setNewTeamName("")
        // Optimistically update UI or re-fetch. For now, revalidation will handle it.
        // To immediately update UI without waiting for revalidation:
        // const newTeamData = { id: `temp-id-${Date.now()}`, name: formData.get("newTeamName") as string, created_at: new Date().toISOString() };
        // setTeams(prev => [...prev, newTeamData]);
        // Then, after revalidatePath, the actual data will replace this.
      }
    })
  }

  const handleCreateTeamLeader = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTlTransition(async () => {
      const result = await createTeamLeader(formData)
      if (result?.error) {
        toast.error("Failed to create Team Leader", { description: result.error })
      } else if (result?.success) {
        toast.success(result.message || "Team Leader created successfully!")
        setNewTlName("")
        setNewTlEmail("")
        setNewTlPassword("")
        // Optimistically update UI or re-fetch
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Teams & Team Leaders</h1>
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
              <PlusCircle className="h-5 w-5 text-green-500" />
              Create New Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="newTeamName">Team Name</Label>
                <Input
                  id="newTeamName"
                  name="newTeamName"
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Alpha Operations"
                  disabled={isTeamPending}
                  required
                />
              </div>
              <Button type="submit" disabled={isTeamPending}>
                {isTeamPending ? "Creating Team..." : "Create Team"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Create New Team Leader
            </CardTitle>
            <CardDescription>Assign the new Team Leader to an existing team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeamLeader} className="space-y-4">
              <div>
                <Label htmlFor="newTlName">Team Leader Name</Label>
                <Input
                  id="newTlName"
                  name="newTlName"
                  type="text"
                  value={newTlName}
                  onChange={(e) => setNewTlName(e.target.value)}
                  placeholder="e.g., Alice Wonderland"
                  disabled={isTlPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newTlEmail">Team Leader Email</Label>
                <Input
                  id="newTlEmail"
                  name="newTlEmail"
                  type="email"
                  value={newTlEmail}
                  onChange={(e) => setNewTlEmail(e.target.value)}
                  placeholder="e.g., alice@example.com"
                  disabled={isTlPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newTlPassword" className="flex items-center gap-1">
                  <KeyRound className="h-4 w-4" /> Temporary Password
                </Label>
                <Input
                  id="newTlPassword"
                  name="newTlPassword"
                  type="password"
                  value={newTlPassword}
                  onChange={(e) => setNewTlPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  disabled={isTlPending}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The new Team Leader should change this password upon first login.
                </p>
              </div>
              <div>
                <Label htmlFor="assignTlToTeamId">Assign to Team</Label>
                <select
                  id="assignTlToTeamId"
                  name="assignTlToTeamId"
                  value={assignTlToTeamId}
                  onChange={(e) => setAssignTlToTeamId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={isTlPending || teams.length === 0}
                  required
                >
                  <option value="" disabled>
                    Select a team
                  </option>
                  {teams.map((team: Team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {teams.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">No teams available. Create a team first.</p>
                )}
              </div>
              <Button type="submit" disabled={isTlPending || teams.length === 0}>
                {isTlPending ? "Creating TL..." : "Create Team Leader"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Existing Teams & Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p>No teams created yet.</p>
          ) : (
            <ul className="space-y-4">
              {teams.map((team: Team) => (
                <li key={team.id} className="p-4 border rounded-md">
                  <h3 className="text-lg font-semibold">
                    {team.name} (ID: {team.id.substring(0, 6)})
                  </h3>
                  <div className="ml-4 mt-2">
                    <h4 className="font-medium">Team Leaders:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {users
                        .filter((u: User) => u.role === "team-leader" && u.team_id === team.id)
                        .map((tl: User) => (
                          <li key={tl.id}>
                            {tl.name} ({tl.email})
                          </li>
                        ))}
                      {users.filter((u: User) => u.role === "team-leader" && u.team_id === team.id).length === 0 && (
                        <li className="text-muted-foreground">No TLs assigned</li>
                      )}
                    </ul>
                    <h4 className="font-medium mt-2">Mailers:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {users
                        .filter((u: User) => u.role === "mailer" && u.team_id === team.id)
                        .map((mailer: User) => (
                          <li key={mailer.id}>
                            {mailer.name} ({mailer.email})
                          </li>
                        ))}
                      {users.filter((u: User) => u.role === "mailer" && u.team_id === team.id).length === 0 && (
                        <li className="text-muted-foreground">No Mailers in this team</li>
                      )}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminTeamsClientPage
