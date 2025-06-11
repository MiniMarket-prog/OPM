"use client" // This directive makes this a Client Component

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { User, Team } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  Building,
  Users,
  ServerIcon,
  Mail,
  ShieldCheck,
  UserPlus,
  BarChart3,
  RotateCcw,
  UserCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMockDB } from "@/lib/mock-data-store" // Keep for revenue notifications for now

const getFormattedDate = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

export interface DashboardStats {
  totalUsers: number
  totalTeamLeaders: number
  totalMailers: number
  totalServers: number
  activeServers: number
  returnedServers: number
  totalSeedEmails: number
  activeSeedEmails: number
  warmupSeedEmails: number
  totalProxies: number
  activeProxies: number
  returnedProxies: number
}

interface DashboardClientContentProps {
  initialUser: User & { teams: Team | null } // Ensure teams is part of initialUser type
  allUsersForSimulator: User[]
  stats: DashboardStats
}

export function DashboardClientContent({ initialUser, allUsersForSimulator, stats }: DashboardClientContentProps) {
  // Assuming useMockDB is still needed for revenue notifications. If not, remove it.
  const [db, { getRevenueForMailerForDate }] = useMockDB()
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUser.id)
  const [currentUser, setCurrentUser] = useState<User | undefined>(initialUser)

  // Notification states (using mockDB for now)
  const [showMailerRevenueNotification, setShowMailerRevenueNotification] = useState(false)
  const [tlMissingRevenueMailers, setTlMissingRevenueMailers] = useState<User[]>([])
  const [adminMissingRevenueCount, setAdminMissingRevenueCount] = useState(0)
  const [adminMissingRevenueTeams, setAdminMissingRevenueTeams] = useState<string[]>([])

  useEffect(() => {
    const userFromSimulator = allUsersForSimulator.find((u) => u.id === selectedUserId)
    setCurrentUser(userFromSimulator || initialUser)
  }, [selectedUserId, allUsersForSimulator, initialUser])

  useEffect(() => {
    if (currentUser) {
      const yesterday = getFormattedDate(-1)
      setShowMailerRevenueNotification(false)
      setTlMissingRevenueMailers([])
      setAdminMissingRevenueCount(0)
      setAdminMissingRevenueTeams([])

      if (currentUser.role === "mailer") {
        const revenueLogged = getRevenueForMailerForDate(currentUser.id, yesterday)
        setShowMailerRevenueNotification(!revenueLogged)
      } else if (currentUser.role === "team-leader" && currentUser.team_id) {
        const mailersInTeam = db.users.filter((u: User) => u.role === "mailer" && u.team_id === currentUser.team_id)
        const missing = mailersInTeam.filter((mailer: User) => !getRevenueForMailerForDate(mailer.id, yesterday))
        setTlMissingRevenueMailers(missing)
      } else if (currentUser.role === "admin") {
        const allMailers = db.users.filter((u: User) => u.role === "mailer")
        const missingMailers = allMailers.filter((mailer: User) => !getRevenueForMailerForDate(mailer.id, yesterday))
        setAdminMissingRevenueCount(missingMailers.length)
        if (missingMailers.length > 0) {
          const teamsWithMissing = Array.from(
            new Set(missingMailers.map((m: User) => m.team_id).filter(Boolean) as string[]),
          ).map(
            (teamId: string) =>
              db.teams.find((t: Team) => t.id === teamId)?.name || `Team ID: ${teamId.substring(0, 6)}`,
          )
          setAdminMissingRevenueTeams(teamsWithMissing)
        }
      }
    }
  }, [currentUser, db.dailyRevenues, db.users, db.teams, getRevenueForMailerForDate])

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Loading user data...</p>
      </div>
    )
  }

  const getInitials = (name?: string): string => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      // Fallback if name is not usable
      if (currentUser?.email) {
        const emailPrefix = currentUser.email.split("@")[0]
        if (emailPrefix && emailPrefix.length > 0) {
          return emailPrefix[0].toUpperCase()
        }
      }
      return "?" // Absolute fallback for avatar
    }
    return name
      .trim()
      .split(" ")
      .filter((n) => n.length > 0) // Avoid issues with multiple spaces
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const teamName = currentUser.team_id
    ? (initialUser.teams?.name as string) || // Use initialUser.teams which is correctly typed
      (db.teams.find((t: Team) => t.id === currentUser.team_id)?.name as string) || // Fallback to mockDB if needed
      currentUser.team_id
    : "N/A"

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {/* Avatar is now in the sidebar header, can be removed or kept for page-specific display */}
            {/* <AvatarImage
                src={
                  currentUser.avatar_url ||
                  `/placeholder.svg?width=40&height=40&query=${encodeURIComponent(currentUser.name || "avatar")}`
                }
                alt={currentUser.name || "User Avatar"}
              />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            */}
          </Avatar>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>
      <p className="mb-6 text-muted-foreground">
        Welcome, <span className="font-semibold text-primary">{currentUser.name || "User"}</span>! You are logged in as
        an <span className="font-semibold">{currentUser.role}</span>.
        {currentUser.role === "team-leader" && currentUser.team_id && (
          <>
            {" "}
            Managing Team: <span className="font-semibold">{teamName}</span>.
          </>
        )}
        {currentUser.role === "mailer" && currentUser.team_id && (
          <>
            {" "}
            Part of Team: <span className="font-semibold">{teamName}</span>. ISP Focus:{" "}
            {currentUser.isp_focus?.join(", ") || "N/A"}
          </>
        )}
      </p>

      {currentUser.role === "mailer" && showMailerRevenueNotification && (
        <Alert variant="default" className="mb-6 bg-yellow-50 border-yellow-300 text-yellow-700">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <AlertDescription className="flex justify-between items-center">
            <div>Don't forget to log your revenue for yesterday ({getFormattedDate(-1)})!</div>
            <Button variant="outline" size="sm" asChild className="border-yellow-400 hover:bg-yellow-100">
              <Link href="/mailer/resources#revenue-log">
                <DollarSign className="mr-2 h-4 w-4" /> Log Revenue
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {currentUser.role === "team-leader" && tlMissingRevenueMailers.length > 0 && (
        <Alert variant="default" className="mb-6 bg-orange-50 border-orange-300 text-orange-700">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <AlertDescription>
            <p className="font-semibold">
              Action Required: The following mailers in your team still need to log revenue for yesterday (
              {getFormattedDate(-1)}):
            </p>
            <ul className="list-disc list-inside pl-4 mt-1 text-sm">
              {tlMissingRevenueMailers.map((mailer: User) => (
                <li key={mailer.id}>{mailer.name}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {currentUser.role === "admin" && adminMissingRevenueCount > 0 && (
        <Alert variant="default" className="mb-6 bg-red-50 border-red-300 text-red-700">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <AlertDescription>
            <p className="font-semibold">
              Attention: {adminMissingRevenueCount} mailer(s) across the system have not logged revenue for yesterday (
              {getFormattedDate(-1)}).
            </p>
            {adminMissingRevenueTeams.length > 0 && (
              <p className="text-sm mt-1">Teams affected include: {adminMissingRevenueTeams.join(", ")}.</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentUser.role === "admin" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" /> Manage Teams
                </CardTitle>
                <CardDescription>Create new teams and assign Team Leaders.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/admin/teams">Go to Team Management</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> View Statistics
                </CardTitle>
                <CardDescription>See charts and stats for all operations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/admin/stats">Go to Statistics</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        {currentUser.role === "team-leader" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Manage Mailers
                </CardTitle>
                <CardDescription>Create and manage Mailer accounts for your team.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/team-leader/mailers">Go to Mailer Management</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" /> Manage Resource Returns
                </CardTitle>
                <CardDescription>Mark servers, proxies, or RDPs as returned.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/team-leader/returns">Go to Resource Returns</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        {currentUser.role === "mailer" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="h-5 w-5" /> Manage My Resources & Logs
                </CardTitle>
                <CardDescription>Add/edit resources and log daily revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/mailer/resources#revenue-log">Go to My Resources & Logs</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" /> My Profile
                </CardTitle>
                <CardDescription>Update your profile information and image.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/mailer/profile">Go to Profile</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        {(currentUser.role === "admin" || currentUser.role === "team-leader") && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Users Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Users: {stats.totalUsers}</p>
                <p>Team Leaders: {stats.totalTeamLeaders}</p>
                <p>Mailers: {stats.totalMailers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="h-5 w-5" /> Servers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Servers: {stats.totalServers}</p>
                <p>Active: {stats.activeServers}</p>
                <p>Returned: {stats.returnedServers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Seed Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Seed Emails: {stats.totalSeedEmails}</p>
                <p>Active: {stats.activeSeedEmails}</p>
                <p>Warmup: {stats.warmupSeedEmails}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Proxies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Proxies: {stats.totalProxies}</p>
                <p>Active: {stats.activeProxies}</p>
                <p>Returned: {stats.returnedProxies}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
