"use client"

import { Users, Mail, HardDrive, Wifi, AlertTriangle, ServerIcon, ShieldCheck, MonitorPlay } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { User, Team, Server, ProxyItem, SeedEmail, Rdp, ResourceReturnItem, ActionResult } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { QuickAddRevenueDialog } from "@/components/mailer/quick-add-revenue-dialog"
import { approveServerReturn, rejectServerReturn } from "@/app/(dashboard)/team-leader/returns/actions"
import { useToast } from "@/hooks/use-toast" // Corrected: Import useToast hook
import { useRouter } from "next/navigation"

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

export interface DashboardClientContentProps {
  currentUser: User & { teams: Team | null }
  mailersNeedingRevenueLog: Array<{
    id: string
    full_name: string | null
    team_id?: string | null
    email?: string | null
  }> // Added email
  teamPendingReturns: ResourceReturnItem[]
  totalUsers: number
  totalTeamLeaders: number
  totalMailers: number
  totalServers: number
  totalProxies: number
  totalSeedEmails: number
  totalRdps: number
  totalTeams: number
  totalPendingUsers: number
  initialServers?: Server[]
  initialProxies?: ProxyItem[]
  initialSeedEmails?: SeedEmail[]
  initialRdps?: Rdp[]
  initialTeamMailers?: User[]
}

const getFormattedDate = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

export function DashboardClientContent({
  currentUser: initialUser,
  mailersNeedingRevenueLog,
  teamPendingReturns,
  totalUsers,
  totalTeamLeaders,
  totalMailers,
  totalServers,
  totalProxies,
  totalSeedEmails,
  totalRdps,
  totalTeams,
  totalPendingUsers,
  initialServers = [],
  initialProxies = [],
  initialSeedEmails = [],
  initialRdps = [],
  initialTeamMailers = [],
}: DashboardClientContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState(initialUser)
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false)
  const [selectedMailerId, setSelectedMailerId] = useState<string>("") // Initialize as empty string
  const { toast } = useToast() // Corrected: Call useToast hook here
  const router = useRouter()

  const yesterday = getFormattedDate(-1)
  const hasLoggedRevenueForYesterday = mailersNeedingRevenueLog.length === 0

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const handleQuickLogRevenue = (mailerId: string) => {
    setSelectedMailerId(mailerId)
    setIsRevenueDialogOpen(true)
  }

  const handleApproveReturn = async (serverId: string) => {
    const result: ActionResult<Server> = await approveServerReturn(serverId)
    if (result.success) {
      toast({ title: "Success", description: result.message }) // Use result.message
      router.refresh()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" }) // Use result.message
    }
  }

  const handleRejectReturn = async (serverId: string) => {
    const result: ActionResult<Server> = await rejectServerReturn(serverId)
    if (result.success) {
      toast({ title: "Success", description: result.message }) // Use result.message
      router.refresh()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" }) // Use result.message
    }
  }

  // Calculate team-specific resource stats for Team Leader
  const teamServers = initialServers.filter((s) => s.team_id === user.team_id)
  const teamProxies = initialProxies.filter((p) => p.team_id === user.team_id)
  const teamSeedEmails = initialSeedEmails.filter((se) => se.team_id === user.team_id)
  const teamRdps = initialRdps.filter((r) => r.team_id === user.team_id)

  const teamActiveServers = teamServers.filter((s) => s.status === "active").length
  const teamReturnedServers = teamServers.filter((s) => s.status === "returned").length
  const teamPendingReturnServers = teamServers.filter((s) => s.status === "pending_return_approval").length
  const teamTotalServers = teamServers.length

  const teamActiveProxies = teamProxies.filter((p) => p.status === "active").length
  const teamReturnedProxies = teamProxies.filter((p) => p.status === "returned").length
  const teamTotalProxies = teamProxies.length

  const teamActiveSeedEmails = teamSeedEmails.filter((se) => se.status === "active").length
  const teamWarmupSeedEmails = teamSeedEmails.filter((se) => se.status === "warmup").length
  const teamTotalSeedEmails = teamSeedEmails.length

  const teamActiveRdps = teamRdps.filter((r) => r.status === "active").length
  const teamReturnedRdps = teamRdps.filter((r) => r.status === "returned").length
  const teamTotalRdps = teamRdps.length

  const renderDashboardContent = () => {
    if (user.role === "admin") {
      return (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalTeamLeaders} Team Leaders, {totalMailers} Mailers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServers}</div>
                <p className="text-xs text-muted-foreground">
                  {/* Assuming active/returned stats are part of totalServers or fetched separately for admin */}
                  {/* {stats.activeServers} Active, {stats.returnedServers} Returned */}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Seed Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSeedEmails}</div>
                <p className="text-xs text-muted-foreground">
                  {/* {stats.activeSeedEmails} Active, {stats.warmupSeedEmails} Warmup */}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProxies}</div>
                <p className="text-xs text-muted-foreground">
                  {/* {stats.activeProxies} Active, {stats.returnedProxies} Returned */}
                </p>
              </CardContent>
            </Card>
            {mailersNeedingRevenueLog.length > 0 && (
              <Card className="col-span-full border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Mailers Needing Revenue Log ({yesterday})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm">
                    {mailersNeedingRevenueLog.map((mailer) => (
                      <li key={mailer.id}>
                        {mailer.full_name} {mailer.email ? `(${mailer.email})` : ""}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">These mailers have not logged revenue for yesterday.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="users">
            <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
            <p className="text-muted-foreground">User management options will be displayed here.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/user-approval">Approve New Users</Link>
            </Button>
            <Button asChild variant="outline" className="ml-2 mt-4">
              <Link href="/admin/teams">Manage Teams</Link>
            </Button>
          </TabsContent>
          <TabsContent value="resources">
            <h2 className="text-xl font-semibold mb-4">Manage Resources (Admin View)</h2>
            <p className="text-muted-foreground">Resource management options for administrators.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/ip-whitelist">Manage IP Whitelist</Link>
            </Button>
          </TabsContent>
          <TabsContent value="settings">
            <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
            <p className="text-muted-foreground">Global application settings.</p>
          </TabsContent>
        </Tabs>
      )
    } else if (user.role === "team-leader") {
      return (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mailers">Team Mailers</TabsTrigger>
            <TabsTrigger value="resources">Team Resources</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Mailers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage team members</div>
                <Button asChild className="mt-2">
                  <Link href="/team-leader/mailers">View Mailers</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Resources</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Oversee shared resources</div>
                <Button asChild className="mt-2">
                  <Link href="/team-leader/resources">View Resources</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returns Management</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track and handle returns</div>
                <Button asChild className="mt-2">
                  <Link href="/team-leader/returns">View Returns</Link>
                </Button>
              </CardContent>
            </Card>
            {mailersNeedingRevenueLog.length > 0 && (
              <Card className="col-span-full border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Team Mailers Needing Revenue Log ({yesterday})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm">
                    {mailersNeedingRevenueLog.map((mailer) => (
                      <li key={mailer.id} className="flex items-center justify-between">
                        {mailer.full_name} {mailer.email ? `(${mailer.email})` : ""}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickLogRevenue(mailer.id)}
                          className="ml-2"
                        >
                          Quick Log
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">These mailers in your team have not logged revenue for yesterday.</p>
                </CardContent>
              </Card>
            )}
            {teamPendingReturns.length > 0 && (
              <Card className="col-span-full border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Pending Server Returns ({teamPendingReturns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm">
                    {teamPendingReturns.map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        {item.ip_address} ({item.profiles?.[0]?.full_name || "Unknown Mailer"})
                        <div className="flex space-x-2 ml-2">
                          <Button variant="outline" size="sm" onClick={() => handleApproveReturn(item.id)}>
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleRejectReturn(item.id)}>
                            Reject
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">
                    There are {teamPendingReturns.length} server(s) awaiting your approval for return.
                  </p>
                  <Button asChild className="mt-2" variant="secondary">
                    <Link href="/team-leader/returns">Review Returns</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="mailers">
            <h2 className="text-xl font-semibold mb-4">Team Mailers Management</h2>
            <p className="text-muted-foreground mb-4">Details about your team&apos;s mailers.</p>
            {initialTeamMailers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mailers found in your team.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {initialTeamMailers.map((mailer) => (
                  <Card key={mailer.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" /> {mailer.full_name || mailer.username || "Unknown Mailer"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{mailer.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {mailer.role}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Button asChild className="mt-4">
              <Link href="/team-leader/mailers">Go to Team Mailers Page for full details</Link>
            </Button>
          </TabsContent>
          <TabsContent value="resources">
            <h2 className="text-xl font-semibold mb-4">Team Resources Overview</h2>
            <p className="text-muted-foreground mb-4">Summary of resources specific to your team.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Servers</CardTitle>
                  <ServerIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamTotalServers}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamActiveServers} Active, {teamReturnedServers} Returned, {teamPendingReturnServers} Pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proxies</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamTotalProxies}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamActiveProxies} Active, {teamReturnedProxies} Returned
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Seed Emails</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamTotalSeedEmails}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamActiveSeedEmails} Active, {teamWarmupSeedEmails} Warmup
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">RDPs</CardTitle>
                  <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamTotalRdps}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamActiveRdps} Active, {teamReturnedRdps} Returned
                  </p>
                </CardContent>
              </Card>
            </div>
            <Button asChild className="mt-4">
              <Link href="/team-leader/resources">Go to Team Resources Page for full details</Link>
            </Button>
          </TabsContent>
          <TabsContent value="returns">
            <h2 className="text-xl font-semibold mb-4">Team Returns</h2>
            <p className="text-muted-foreground">Manage and view returns for your team.</p>
            <Button asChild className="mt-4">
              <Link href="/team-leader/returns">Go to Returns Page</Link>
            </Button>
          </TabsContent>
        </Tabs>
      )
    }
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      {renderDashboardContent()}
      {selectedMailerId && ( // Only render if mailerId is set
        <QuickAddRevenueDialog
          isOpen={isRevenueDialogOpen}
          onOpenChange={setIsRevenueDialogOpen}
          mailerId={selectedMailerId}
          teamId={user.team_id || ""} // Pass teamId, ensure it's not null
          onRevenueLogged={() => router.refresh()} // Revalidate dashboard on log
        />
      )}
    </div>
  )
}
