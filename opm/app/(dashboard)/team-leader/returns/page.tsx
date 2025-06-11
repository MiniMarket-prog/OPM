"use client"
import { useState } from "react"
import { useMockDB } from "@/lib/mock-data-store"
import type { Server as ServerType, ProxyItem, Rdp, User, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { UserRoleSimulator } from "@/components/user-role-simulator"
import { ServerIcon, ShieldCheck, MonitorPlay, RotateCcw, Building, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface ResourceItemProps {
  item: ServerType | ProxyItem | Rdp
  type: "Server" | "Proxy" | "RDP"
  onReturn: (id: string, type: "Server" | "Proxy" | "RDP") => void
}

function ResourceReturnItem({ item, type, onReturn }: ResourceItemProps) {
  let name = ""
  if (type === "Server") name = (item as ServerType).ip_address
  else if (type === "Proxy") name = (item as ProxyItem).proxy_string
  else if (type === "RDP") name = (item as Rdp).connection_info

  const mailer = useMockDB()[0].users.find((u: User) => u.id === item.added_by_mailer_id)

  return (
    <li className="p-3 border rounded-md flex justify-between items-center bg-card hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          Type: {type} | Added by: {mailer?.name || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground">
          Current Status: <Badge variant={item.status === "active" ? "default" : "outline"}>{item.status}</Badge>
        </p>
      </div>
      {item.status !== "returned" && (
        <Button variant="destructive" size="sm" onClick={() => onReturn(item.id, type)}>
          <RotateCcw className="mr-2 h-4 w-4" /> Mark as Returned
        </Button>
      )}
      {item.status === "returned" && (
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
          <CheckCircle className="h-4 w-4" /> Returned
        </Badge>
      )}
    </li>
  )
}

export default function TLReturnsPage() {
  const [db, { getCurrentUser, updateServerStatus, updateProxyStatus, updateRdpStatus }] = useMockDB()
  const firstTL = db.users.find((u: User) => u.role === "team-leader")
  const [selectedUserId, setSelectedUserId] = useState<string>(firstTL?.id || db.users[0]?.id || "")
  const currentUser = getCurrentUser(selectedUserId)

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

  const handleReturnResource = (id: string, type: "Server" | "Proxy" | "RDP") => {
    if (type === "Server") updateServerStatus(id, "returned")
    else if (type === "Proxy") updateProxyStatus(id, "returned")
    else if (type === "RDP") updateRdpStatus(id, "returned")
  }

  const teamServers = db.servers.filter((s: ServerType) => s.team_id === currentUser.team_id)
  const teamProxies = db.proxies.filter((p: ProxyItem) => p.team_id === currentUser.team_id)
  const teamRdps = db.rdps.filter((r: Rdp) => r.team_id === currentUser.team_id)

  const activeServers = teamServers.filter((s: ServerType) => s.status !== "returned")
  const activeProxies = teamProxies.filter((p: ProxyItem) => p.status !== "returned")
  const activeRdps = teamRdps.filter((r: Rdp) => r.status !== "returned")

  const returnedServers = teamServers.filter((s: ServerType) => s.status === "returned")
  const returnedProxies = teamProxies.filter((p: ProxyItem) => p.status === "returned")
  const returnedRdps = teamRdps.filter((r: Rdp) => r.status === "returned")

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UserRoleSimulator
        currentUser={currentUser}
        allUsers={db.users}
        onUserChange={setSelectedUserId}
        className="mb-6"
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Resource Returns for Team: {currentTeam?.name || "N/A"}</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5" /> Servers ({activeServers.length} Active)
            </CardTitle>
            <CardDescription>Mark servers with problems as "returned".</CardDescription>
          </CardHeader>
          <CardContent>
            {activeServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active servers in your team.</p>
            ) : (
              <ul className="space-y-3">
                {activeServers.map((server: ServerType) => (
                  <ResourceReturnItem key={server.id} item={server} type="Server" onReturn={handleReturnResource} />
                ))}
              </ul>
            )}
            {returnedServers.length > 0 && (
              <h4 className="text-md font-semibold mt-4 mb-2">Returned Servers ({returnedServers.length})</h4>
            )}
            <ul className="space-y-3">
              {returnedServers.map((server: ServerType) => (
                <ResourceReturnItem key={server.id} item={server} type="Server" onReturn={handleReturnResource} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Proxies ({activeProxies.length} Active)
            </CardTitle>
            <CardDescription>Mark problematic proxies as "returned".</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProxies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active proxies in your team.</p>
            ) : (
              <ul className="space-y-3">
                {activeProxies.map((proxy: ProxyItem) => (
                  <ResourceReturnItem key={proxy.id} item={proxy} type="Proxy" onReturn={handleReturnResource} />
                ))}
              </ul>
            )}
            {returnedProxies.length > 0 && (
              <h4 className="text-md font-semibold mt-4 mb-2">Returned Proxies ({returnedProxies.length})</h4>
            )}
            <ul className="space-y-3">
              {returnedProxies.map((proxy: ProxyItem) => (
                <ResourceReturnItem key={proxy.id} item={proxy} type="Proxy" onReturn={handleReturnResource} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" /> RDPs ({activeRdps.length} Active)
            </CardTitle>
            <CardDescription>Mark problematic RDPs as "returned".</CardDescription>
          </CardHeader>
          <CardContent>
            {activeRdps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active RDPs in your team.</p>
            ) : (
              <ul className="space-y-3">
                {activeRdps.map((rdp: Rdp) => (
                  <ResourceReturnItem key={rdp.id} item={rdp} type="RDP" onReturn={handleReturnResource} />
                ))}
              </ul>
            )}
            {returnedRdps.length > 0 && (
              <h4 className="text-md font-semibold mt-4 mb-2">Returned RDPs ({returnedRdps.length})</h4>
            )}
            <ul className="space-y-3">
              {returnedRdps.map((rdp: Rdp) => (
                <ResourceReturnItem key={rdp.id} item={rdp} type="RDP" onReturn={handleReturnResource} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
