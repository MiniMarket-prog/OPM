"use client"
import { useState, useMemo } from "react"
import type { User, Server, ProxyItem, SeedEmail, Rdp, Team } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FilterX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserRoleSimulator, type UserRoleSimulatorProps } from "@/components/user-role-simulator"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import {
  getTLServerColumns,
  getTLProxyColumns,
  getTLSeedEmailColumns,
  getTLRdpColumns,
  getTLMailerColumns,
} from "./columns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TLResourcesClientPageProps {
  currentUser: User & { teams?: Team }
  allUsers: User[]
  initialServers: Server[]
  initialProxies: ProxyItem[]
  initialSeedEmails: SeedEmail[]
  initialRdps: Rdp[]
  initialTeamMailers: User[]
}

export default function TLResourcesClientPage({
  currentUser,
  allUsers,
  initialServers,
  initialProxies,
  initialSeedEmails,
  initialRdps,
  initialTeamMailers,
}: TLResourcesClientPageProps) {
  const [selectedMailerIdFilter, setSelectedMailerIdFilter] = useState<string | null>(null)
  const [selectedServerStatusFilter, setSelectedServerStatusFilter] = useState<Server["status"] | null>(null)
  const [selectedProxyStatusFilter, setSelectedProxyStatusFilter] = useState<ProxyItem["status"] | null>(null)
  const [selectedSeedEmailStatusFilter, setSelectedSeedEmailStatusFilter] = useState<SeedEmail["status"] | null>(null)
  const [selectedRdpStatusFilter, setSelectedRdpStatusFilter] = useState<Rdp["status"] | null>(null)

  // Memoized filtered data for each resource type
  const filteredServers = useMemo(() => {
    let currentData = initialServers
    if (selectedMailerIdFilter) {
      currentData = currentData.filter((server) => server.user_id === selectedMailerIdFilter)
    }
    if (selectedServerStatusFilter) {
      currentData = currentData.filter((server) => server.status === selectedServerStatusFilter)
    }
    return currentData
  }, [initialServers, selectedMailerIdFilter, selectedServerStatusFilter])

  const filteredProxies = useMemo(() => {
    let currentData = initialProxies
    if (selectedMailerIdFilter) {
      currentData = currentData.filter((proxy) => proxy.user_id === selectedMailerIdFilter)
    }
    if (selectedProxyStatusFilter) {
      currentData = currentData.filter((proxy) => proxy.status === selectedProxyStatusFilter)
    }
    return currentData
  }, [initialProxies, selectedMailerIdFilter, selectedProxyStatusFilter])

  const filteredSeedEmails = useMemo(() => {
    let currentData = initialSeedEmails
    if (selectedMailerIdFilter) {
      currentData = currentData.filter((seed) => seed.user_id === selectedMailerIdFilter)
    }
    if (selectedSeedEmailStatusFilter) {
      currentData = currentData.filter((seed) => seed.status === selectedSeedEmailStatusFilter)
    }
    return currentData
  }, [initialSeedEmails, selectedMailerIdFilter, selectedSeedEmailStatusFilter])

  const filteredRdps = useMemo(() => {
    let currentData = initialRdps
    if (selectedMailerIdFilter) {
      currentData = currentData.filter((rdp) => rdp.user_id === selectedMailerIdFilter)
    }
    if (selectedRdpStatusFilter) {
      currentData = currentData.filter((rdp) => rdp.status === selectedRdpStatusFilter)
    }
    return currentData
  }, [initialRdps, selectedMailerIdFilter, selectedRdpStatusFilter])

  const [activeResourceView, setActiveResourceView] = useState<
    "servers" | "proxies" | "seed-emails" | "rdps" | "team-mailers"
  >("servers")

  const handleUserChangeForSimulator: UserRoleSimulatorProps["onUserChange"] = (newUserId) => {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("simulated_user_id", newUserId)
    window.location.href = newUrl.toString()
  }

  const serverColumns = useMemo(() => getTLServerColumns(), [])
  const proxyColumns = useMemo(() => getTLProxyColumns(), [])
  const seedEmailColumns = useMemo(() => getTLSeedEmailColumns(), [])
  const rdpColumns = useMemo(() => getTLRdpColumns(), [])
  const mailerColumns = useMemo(() => getTLMailerColumns(), [])

  if (currentUser.role !== "team-leader" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            You do not have the required role (Team Leader) or are not assigned to a team to view this page.
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Please contact an administrator if you believe this is an error.
          </p>
          <Button variant="outline" asChild className="mt-6">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <UserRoleSimulator
            currentUser={currentUser}
            allUsers={allUsers}
            onUserChange={handleUserChangeForSimulator}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Team Resources (Team: {currentUser.teams?.name || "N/A"})</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </div>
      <UserRoleSimulator currentUser={currentUser} allUsers={allUsers} onUserChange={handleUserChangeForSimulator} />

      <div className="flex items-center space-x-2 mt-4 flex-wrap gap-2">
        {/* Mailer Filter */}
        <div className="flex items-center space-x-2">
          <Select
            value={selectedMailerIdFilter || "all"}
            onValueChange={(value) => setSelectedMailerIdFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Mailer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mailers</SelectItem>
              {initialTeamMailers.map((mailer) => (
                <SelectItem key={mailer.id} value={mailer.id}>
                  {mailer.name || mailer.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMailerIdFilter && (
            <Button variant="ghost" onClick={() => setSelectedMailerIdFilter(null)} className="h-8 w-8 p-0">
              <FilterX className="h-4 w-4" />
              <span className="sr-only">Clear mailer filter</span>
            </Button>
          )}
        </div>

        {/* Status Filter (Conditional based on active tab) */}
        {activeResourceView === "servers" && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedServerStatusFilter || "all"}
              onValueChange={(value) =>
                setSelectedServerStatusFilter(value === "all" ? null : (value as Server["status"]))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            {selectedServerStatusFilter && (
              <Button variant="ghost" onClick={() => setSelectedServerStatusFilter(null)} className="h-8 w-8 p-0">
                <FilterX className="h-4 w-4" />
                <span className="sr-only">Clear server status filter</span>
              </Button>
            )}
          </div>
        )}

        {activeResourceView === "proxies" && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedProxyStatusFilter || "all"}
              onValueChange={(value) =>
                setSelectedProxyStatusFilter(value === "all" ? null : (value as ProxyItem["status"]))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            {selectedProxyStatusFilter && (
              <Button variant="ghost" onClick={() => setSelectedProxyStatusFilter(null)} className="h-8 w-8 p-0">
                <FilterX className="h-4 w-4" />
                <span className="sr-only">Clear proxy status filter</span>
              </Button>
            )}
          </div>
        )}

        {activeResourceView === "seed-emails" && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedSeedEmailStatusFilter || "all"}
              onValueChange={(value) =>
                setSelectedSeedEmailStatusFilter(value === "all" ? null : (value as SeedEmail["status"]))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warmup">Warmup</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="cooldown">Cooldown</SelectItem>
              </SelectContent>
            </Select>
            {selectedSeedEmailStatusFilter && (
              <Button variant="ghost" onClick={() => setSelectedSeedEmailStatusFilter(null)} className="h-8 w-8 p-0">
                <FilterX className="h-4 w-4" />
                <span className="sr-only">Clear seed email status filter</span>
              </Button>
            )}
          </div>
        )}

        {activeResourceView === "rdps" && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedRdpStatusFilter || "all"}
              onValueChange={(value) => setSelectedRdpStatusFilter(value === "all" ? null : (value as Rdp["status"]))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            {selectedRdpStatusFilter && (
              <Button variant="ghost" onClick={() => setSelectedRdpStatusFilter(null)} className="h-8 w-8 p-0">
                <FilterX className="h-4 w-4" />
                <span className="sr-only">Clear RDP status filter</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Tabs value={activeResourceView} onValueChange={(value) => setActiveResourceView(value as any)}>
          <TabsList>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="proxies">Proxies</TabsTrigger>
            <TabsTrigger value="seed-emails">Seed Emails</TabsTrigger>
            <TabsTrigger value="rdps">RDPs</TabsTrigger>
            <TabsTrigger value="team-mailers">Team Mailers</TabsTrigger>
          </TabsList>

          <TabsContent value="servers">
            <DataTable
              columns={serverColumns}
              data={filteredServers}
              filterColumnId="ip_address"
              filterPlaceholder="Filter by IP address..."
            />
          </TabsContent>
          <TabsContent value="proxies">
            <DataTable
              columns={proxyColumns}
              data={filteredProxies}
              filterColumnId="proxy_string"
              filterPlaceholder="Filter by proxy string..."
            />
          </TabsContent>
          <TabsContent value="seed-emails">
            <DataTable
              columns={seedEmailColumns}
              data={filteredSeedEmails}
              filterColumnId="email_address"
              filterPlaceholder="Filter by email address..."
            />
          </TabsContent>
          <TabsContent value="rdps">
            <DataTable
              columns={rdpColumns}
              data={filteredRdps}
              filterColumnId="connection_info"
              filterPlaceholder="Filter by connection info..."
            />
          </TabsContent>
          <TabsContent value="team-mailers">
            <DataTable
              columns={mailerColumns}
              data={initialTeamMailers} // Mailers tab is not filtered by mailer who added resources
              filterColumnId="name"
              filterPlaceholder="Filter by mailer name..."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
