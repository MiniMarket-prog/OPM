"use client"
import { useMockDB } from "@/lib/mock-data-store" // Keep for mock data if still used elsewhere, or remove if fully Supabase
import type { Server as ServerType, ProxyItem, Rdp, User, Team, ActionResult } from "@/lib/types" // Added ActionResult
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ServerIcon, ShieldCheck, MonitorPlay, RotateCcw, Building, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { approveServerReturn, rejectServerReturn } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

interface ResourceItemProps {
  item: ServerType | ProxyItem | Rdp
  type: "Server" | "Proxy" | "RDP"
  onReturn: (id: string, type: "Server" | "Proxy" | "RDP") => void
  onAcceptReturn?: (id: string) => void
  onRejectReturn?: (id: string) => void
}

function ResourceReturnItem({ item, type, onReturn, onAcceptReturn, onRejectReturn }: ResourceItemProps) {
  let name = ""
  if (type === "Server") {
    name = (item as ServerType).ip_address
  } else if (type === "Proxy") {
    name = (item as ProxyItem).proxy_string
  } else if (type === "RDP") {
    name = `${(item as Rdp).ip_address} (${(item as Rdp).username})`
  }

  // CRITICAL CHANGE: Access mailer name directly from the single profiles object
  const mailerName = item.profiles?.full_name || item.profiles?.name || item.profiles?.username || "Unknown"

  const isServerPendingApproval = type === "Server" && item.status === "pending_return_approval"
  const isReturned = item.status === "returned"

  return (
    <li className="p-3 border rounded-md flex justify-between items-center bg-card hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          Type: {type} | Added by: {mailerName}
        </p>
        <p className="text-xs text-muted-foreground">
          Current Status:{" "}
          <Badge
            variant={
              isReturned
                ? "default"
                : isServerPendingApproval
                  ? "outline"
                  : item.status === "active"
                    ? "default"
                    : "secondary"
            }
            className={
              isServerPendingApproval
                ? "bg-orange-100 text-orange-800 border-orange-300"
                : isReturned
                  ? "bg-green-100 text-green-800 border-green-300"
                  : ""
            }
          >
            {item.status.replace(/_/g, " ")}
          </Badge>
        </p>
      </div>
      {type === "Server" && isServerPendingApproval && (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              console.log("Accept button clicked for ID:", item.id)
              onAcceptReturn?.(item.id)
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Accept
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              console.log("Reject button clicked for ID:", item.id)
              onRejectReturn?.(item.id)
            }}
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
        </div>
      )}
      {type !== "Server" && item.status !== "returned" && (
        <Button variant="destructive" size="sm" onClick={() => onReturn(item.id, type)}>
          <RotateCcw className="mr-2 h-4 w-4" /> Mark as Returned
        </Button>
      )}
      {isReturned && (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-4 w-4" /> Returned
        </Badge>
      )}
    </li>
  )
}

interface TLReturnsClientPageProps {
  currentUser: User & { teams: Team | null }
  initialServers: ServerType[]
  initialProxies: ProxyItem[]
  initialRdps: Rdp[]
}

export default function TLReturnsClientPage({
  currentUser,
  initialServers,
  initialProxies,
  initialRdps,
}: TLReturnsClientPageProps) {
  const [db, { updateProxyStatus, updateRdpStatus }] = useMockDB() // Keep for mock data if still used elsewhere
  const { toast } = useToast()

  // Local state to manage servers after actions
  const [servers, setServers] = useState<ServerType[]>(initialServers)

  // Use useEffect to update local state when initialServers prop changes
  useEffect(() => {
    setServers(initialServers)
  }, [initialServers])

  if (!currentUser || currentUser.role !== "team-leader" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4">
        <p>Access Denied. You must be a Team Leader with an assigned team to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const currentTeam = currentUser.teams || db.teams.find((t: Team) => t.id === currentUser.team_id)

  const handleReturnResource = (id: string, type: "Server" | "Proxy" | "RDP") => {
    if (type === "Proxy") {
      updateProxyStatus(id, "returned")
      toast({ title: "Proxy marked as returned." })
    } else if (type === "RDP") {
      updateRdpStatus(id, "returned")
      toast({ title: "RDP marked as returned." })
    }
  }

  const handleAcceptServerReturn = async (serverId: string) => {
    console.log("Attempting to accept server return for ID:", serverId)
    try {
      const result: ActionResult<ServerType> = await approveServerReturn(serverId)
      if (result.success) {
        toast({ title: result.message })
        // Optimistically update the status in local state
        setServers((prev) => prev.map((s) => (s.id === serverId ? { ...s, status: "returned" } : s)))
        console.log("Server accepted successfully. New server state:", servers.find((s) => s.id === serverId)?.status)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        console.error("Server action failed:", result.message)
        // If action failed, re-fetch or revert state if necessary (revalidatePath should handle this)
      }
    } catch (error) {
      console.error("Client-side error calling approveServerReturn:", error)
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    }
  }

  const handleRejectServerReturn = async (serverId: string) => {
    console.log("Attempting to reject server return for ID:", serverId)
    try {
      const result: ActionResult<ServerType> = await rejectServerReturn(serverId)
      if (result.success) {
        toast({ title: result.message })
        // Optimistically update the status in local state
        setServers((prev) => prev.map((s) => (s.id === serverId ? { ...s, status: "active" } : s)))
        console.log("Server rejected successfully. New server state:", servers.find((s) => s.id === serverId)?.status)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        console.error("Server action failed:", result.message)
        // If action failed, re-fetch or revert state if necessary (revalidatePath should handle this)
      }
    } catch (error) {
      console.error("Client-side error calling rejectServerReturn:", error)
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    }
  }

  const teamServers = servers
  const teamProxies = initialProxies
  const teamRdps = initialRdps

  const pendingServers = teamServers.filter((s: ServerType) => s.status === "pending_return_approval")
  const activeServers = teamServers.filter(
    (s: ServerType) => s.status !== "returned" && s.status !== "pending_return_approval",
  )
  const returnedServers = teamServers.filter((s: ServerType) => s.status === "returned")

  const activeProxies = teamProxies.filter((p: ProxyItem) => p.status !== "returned")
  const returnedProxies = teamProxies.filter((p: ProxyItem) => p.status === "returned")

  const activeRdps = teamRdps.filter((r: Rdp) => r.status !== "returned")
  const returnedRdps = teamRdps.filter((r: Rdp) => r.status === "returned")

  return (
    <div className="container mx-auto p-4 md:p-6">
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
            <CardDescription>Manage server return requests and active servers.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingServers.length > 0 && (
              <>
                <h4 className="text-md font-semibold mb-2 text-orange-600 dark:text-orange-400">
                  Pending Return Approval ({pendingServers.length})
                </h4>
                <ul className="space-y-3 mb-4">
                  {pendingServers.map((server: ServerType) => (
                    <ResourceReturnItem
                      key={server.id}
                      item={server}
                      type="Server"
                      onReturn={handleReturnResource}
                      onAcceptReturn={handleAcceptServerReturn}
                      onRejectReturn={handleRejectServerReturn}
                    />
                  ))}
                </ul>
              </>
            )}

            {activeServers.length === 0 && pendingServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active servers in your team.</p>
            ) : (
              <>
                <h4 className="text-md font-semibold mb-2">Active Servers ({activeServers.length})</h4>
                <ul className="space-y-3">
                  {activeServers.map((server: ServerType) => (
                    <ResourceReturnItem key={server.id} item={server} type="Server" onReturn={handleReturnResource} />
                  ))}
                </ul>
              </>
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
