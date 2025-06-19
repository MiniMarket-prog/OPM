"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeader } from "@/components/ui/table"
import type { User, Server as ServerType, ProxyItem, SeedEmail, Rdp, Team, DailyRevenue } from "@/lib/types"
import { BulkImport } from "@/components/mailer/bulk-import"
import { EditServerDialog } from "@/components/mailer/edit-server-dialog"
import { EditProxyDialog } from "@/components/mailer/edit-proxy-dialog"
import { EditSeedEmailDialog } from "@/components/mailer/edit-seed-email-dialog"
import { EditRdpDialog } from "@/components/mailer/edit-rdp-dialog"
import { DownloadSeedsDialog } from "@/components/mailer/download-seeds-dialog"
import { QuickAddRevenueDialog } from "@/components/mailer/quick-add-revenue-dialog"
import { EditDailyRevenueDialog } from "@/components/mailer/edit-daily-revenue-dialog" // NEW IMPORT
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Download, DollarSign, Edit, Trash2 } from "lucide-react" // ADDED Edit, Trash2 icons
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { deleteServer, deleteProxy, deleteSeedEmail, deleteRdp, addDailyRevenue, deleteDailyRevenue } from "./actions" // ADDED deleteDailyRevenue
import { useActionState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getServerColumns, getProxyColumns, getSeedEmailColumns } from "./columns"
import { RdpCard } from "./resource-cards"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterX } from "lucide-react"

const getFormattedDate = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

interface MailerResourcesClientPageProps {
  currentUser: User & { teams?: Team | null }
  allUsers: User[]
  initialServers: ServerType[]
  initialProxies: ProxyItem[]
  initialSeedEmails: SeedEmail[]
  initialRdps: Rdp[]
  dailyRevenues: DailyRevenue[]
}

type ResourceViewType = "servers" | "proxies" | "seed-emails" | "rdps" | "daily-revenue" // ADDED daily-revenue

type FormState<T = any> = {
  success?: string
  error?: string
  partialErrors?: string[]
  data?: T
}
const initialFormState: FormState = {}

export default function MailerResourcesClientPage({
  currentUser,
  allUsers,
  initialServers,
  initialProxies,
  initialSeedEmails,
  initialRdps,
  dailyRevenues: initialDailyRevenues,
}: MailerResourcesClientPageProps) {
  const [servers, setServers] = useState<ServerType[]>(initialServers)
  const [proxies, setProxies] = useState<ProxyItem[]>(initialProxies)
  const [seedEmails, setSeedEmails] = useState<SeedEmail[]>(initialSeedEmails)
  const [rdps, setRdps] = useState<Rdp[]>(initialRdps)
  const [dailyRevenues, setDailyRevenues] = useState<DailyRevenue[]>(initialDailyRevenues)

  const [editingServer, setEditingServer] = useState<ServerType | null>(null)
  const [editingProxy, setEditingProxy] = useState<ProxyItem | null>(null)
  const [editingSeedEmail, setEditingSeedEmail] = useState<SeedEmail | null>(null)
  const [editingRdp, setEditingRdp] = useState<Rdp | null>(null)
  const [editingDailyRevenue, setEditingDailyRevenue] = useState<DailyRevenue | null>(null) // NEW STATE

  const [activeResourceView, setActiveResourceView] = useState<ResourceViewType>("servers")
  const [seedEmailGroupNameFilter, setSeedEmailGroupNameFilter] = useState("")
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false)
  const [selectedGroupNameFilter, setSelectedGroupNameFilter] = useState<string>("")
  const [isQuickAddRevenueDialogOpen, setIsQuickAddRevenueDialogOpen] = useState(false)

  const [revenueDate, setRevenueDate] = useState(getFormattedDate(0))
  const addRevenueFormRef = useRef<HTMLFormElement>(null)

  const boundAddDailyRevenue = (prevState: FormState<DailyRevenue>, formData: FormData) =>
    addDailyRevenue(
      formData.get("date") as string,
      Number(formData.get("amount")),
      currentUser.id,
      currentUser.team_id!,
    )
  const [revenueFormState, revenueFormAction] = useActionState(boundAddDailyRevenue, initialFormState)

  useEffect(() => setServers(initialServers), [initialServers])
  useEffect(() => setProxies(initialProxies), [initialProxies])
  useEffect(() => setSeedEmails(initialSeedEmails), [initialSeedEmails])
  useEffect(() => setRdps(initialRdps), [initialRdps])
  useEffect(() => setDailyRevenues(initialDailyRevenues), [initialDailyRevenues])

  const handleRevenueLogged = (newRevenue: DailyRevenue) => {
    setDailyRevenues((prev) => {
      const existingIndex = prev.findIndex((r) => r.date === newRevenue.date && r.mailer_id === newRevenue.mailer_id)
      if (existingIndex > -1) {
        const updatedRevenues = [...prev]
        updatedRevenues[existingIndex] = newRevenue
        return updatedRevenues
      }
      return [...prev, newRevenue].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
  }

  const handleRevenueUpdated = (updatedRevenue: DailyRevenue) => {
    setDailyRevenues((prev) =>
      prev
        .map((r) => (r.id === updatedRevenue.id ? updatedRevenue : r))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    setEditingDailyRevenue(null)
  }

  useEffect(() => {
    if (revenueFormState.success) {
      toast.success(revenueFormState.success)
      if (revenueFormState.data) {
        handleRevenueLogged(revenueFormState.data)
      }
      addRevenueFormRef.current?.reset()
      setRevenueDate(getFormattedDate(0))
    }
    if (revenueFormState.error) toast.error("Revenue Error", { description: revenueFormState.error })
  }, [revenueFormState])

  const handleDelete = async (type: ResourceViewType, id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?")
    if (!confirmDelete) return

    let result
    try {
      if (type === "servers") {
        result = await deleteServer(id)
        if (result.success) setServers((prev) => prev.filter((s) => s.id !== id))
      } else if (type === "proxies") {
        result = await deleteProxy(id)
        if (result.success) setProxies((prev) => prev.filter((p) => p.id !== id))
      } else if (type === "seed-emails") {
        result = await deleteSeedEmail(id)
        if (result.success) setSeedEmails((prev) => prev.filter((se) => se.id !== id))
      } else if (type === "rdps") {
        result = await deleteRdp(id)
        if (result.success) setRdps((prev) => prev.filter((r) => r.id !== id))
      } else if (type === "daily-revenue") {
        // NEW: Handle daily revenue deletion
        result = await deleteDailyRevenue(id)
        if (result.success) setDailyRevenues((prev) => prev.filter((rev) => rev.id !== id))
      }

      if (result?.success) toast.success(result.success)
      else if (result?.error) toast.error("Deletion failed", { description: result.error })
    } catch (e: any) {
      toast.error("Deletion failed", { description: e.message })
    }
  }

  const serverColumns = useMemo(() => getServerColumns(setEditingServer, (id) => handleDelete("servers", id)), [])
  const proxyColumns = useMemo(() => getProxyColumns(setEditingProxy, (id) => handleDelete("proxies", id)), [])
  const seedEmailColumns = useMemo(
    () => getSeedEmailColumns(setEditingSeedEmail, (id) => handleDelete("seed-emails", id)),
    [],
  )

  const filteredSeedEmailsByGroupName = useMemo(() => {
    if (!selectedGroupNameFilter) {
      return seedEmails
    }
    return seedEmails.filter((email) => email.group_name === selectedGroupNameFilter)
  }, [seedEmails, selectedGroupNameFilter])

  const availableGroupNamesForDownload = useMemo(
    () => Array.from(new Set(seedEmails.map((s) => s.group_name).filter(Boolean) as string[])).sort(),
    [seedEmails],
  )

  const existingGroupNames = useMemo(() => {
    const groupNames = new Set(seedEmails.map((s) => s.group_name).filter(Boolean) as string[])
    return Array.from(groupNames).sort()
  }, [seedEmails])

  const existingGroupNamesForFilter = useMemo(() => {
    const groupNames = new Set(seedEmails.map((s) => s.group_name).filter(Boolean) as string[])
    return Array.from(groupNames).sort()
  }, [seedEmails])

  const seedEmailExternalActions = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={selectedGroupNameFilter}
          onValueChange={(value) => setSelectedGroupNameFilter(value === "all-groups" ? "" : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by group..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-groups">All Groups</SelectItem>
            {existingGroupNamesForFilter.map((groupName) => (
              <SelectItem key={groupName} value={groupName}>
                {groupName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedGroupNameFilter && (
          <Button variant="ghost" size="icon" onClick={() => setSelectedGroupNameFilter("")} title="Clear group filter">
            <FilterX className="h-4 w-4" />
            <span className="sr-only">Clear group filter</span>
          </Button>
        )}
        <Button variant="outline" onClick={() => setIsDownloadDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" /> Download Seeds
        </Button>
      </div>
    )
  }, [selectedGroupNameFilter, existingGroupNamesForFilter])

  if (currentUser.role !== "mailer" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            You do not have the required role (Mailer) or are not assigned to a team to view this page.
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Please contact an administrator if you believe this is an error.
          </p>
          <Button variant="outline" asChild className="mt-6">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Mailer Resources (Team: {currentUser.teams?.name || "N/A"})
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsQuickAddRevenueDialogOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" /> Quick Log Revenue
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Building className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <BulkImport currentUser={currentUser} existingGroupNames={existingGroupNames} />

      <div className="mt-8">
        <Tabs value={activeResourceView} onValueChange={(value) => setActiveResourceView(value as ResourceViewType)}>
          <TabsList>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="proxies">Proxies</TabsTrigger>
            <TabsTrigger value="seed-emails">Seed Emails</TabsTrigger>
            <TabsTrigger value="rdps">RDPs</TabsTrigger>
          </TabsList>

          <TabsContent value="servers">
            <DataTable
              columns={serverColumns}
              data={servers}
              filterColumnId="ip_address"
              filterPlaceholder="Filter by IP address..."
            />
          </TabsContent>
          <TabsContent value="proxies">
            <DataTable
              columns={proxyColumns}
              data={proxies}
              filterColumnId="proxy_string"
              filterPlaceholder="Filter by proxy string..."
            />
          </TabsContent>
          <TabsContent value="seed-emails">
            <DataTable
              columns={seedEmailColumns}
              data={filteredSeedEmailsByGroupName}
              filterColumnId="email_address"
              filterPlaceholder="Filter by email..."
              externalFilterComponent={seedEmailExternalActions}
            />
          </TabsContent>
          <TabsContent value="rdps">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rdps.map((rdp) => (
                <RdpCard
                  key={rdp.id}
                  item={rdp}
                  onEdit={() => setEditingRdp(rdp)}
                  onDelete={() => handleDelete("rdps", rdp.id)}
                />
              ))}
              {rdps.length === 0 && <p className="col-span-full text-center text-muted-foreground">No RDPs found.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Card id="revenue-log" className="p-6">
        <h2 className="text-xl font-semibold mb-4">Log Daily Revenue</h2>
        <form action={revenueFormAction} ref={addRevenueFormRef} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="revenue-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <Input
                type="date"
                id="revenue-date"
                name="date"
                value={revenueDate}
                onChange={(e) => setRevenueDate(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="revenue-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Amount ($)
              </label>
              <Input
                type="number"
                id="revenue-amount"
                name="amount"
                step="0.01"
                min="0"
                required
                placeholder="e.g., 123.45"
                className="w-full"
              />
            </div>
          </div>
          <Button type="submit">Log Revenue</Button>
          {revenueFormState?.error && <p className="text-sm text-red-600">{revenueFormState.error}</p>}
          {revenueFormState?.success && <p className="text-sm text-green-600">{revenueFormState.success}</p>}
        </form>
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Recent Revenue Entries</h3>
          {dailyRevenues.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRevenues.map((rev) => (
                    <TableRow key={rev.id}>
                      <TableCell>{new Date(rev.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">${rev.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingDailyRevenue(rev)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit revenue</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete("daily-revenue", rev.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete revenue</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No revenue logged yet.</p>
          )}
        </div>
      </Card>

      {editingServer && (
        <EditServerDialog
          server={editingServer}
          isOpen={!!editingServer}
          onOpenChange={(isOpen) => !isOpen && setEditingServer(null)}
          onServerUpdated={(updatedServer: ServerType) => {
            setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)))
            setEditingServer(null)
          }}
        />
      )}
      {editingProxy && (
        <EditProxyDialog
          proxy={editingProxy}
          isOpen={!!editingProxy}
          onOpenChange={(isOpen) => !isOpen && setEditingProxy(null)}
          onProxyUpdated={(updatedProxy: ProxyItem) => {
            setProxies((prev) => prev.map((p) => (p.id === updatedProxy.id ? updatedProxy : p)))
            setEditingProxy(null)
          }}
        />
      )}
      {editingSeedEmail && (
        <EditSeedEmailDialog
          seedEmail={editingSeedEmail}
          isOpen={!!editingSeedEmail}
          onOpenChange={(isOpen) => !isOpen && setEditingSeedEmail(null)}
          onSeedEmailUpdated={(updatedSeedEmail: SeedEmail) => {
            setSeedEmails((prev) => prev.map((se) => (se.id === updatedSeedEmail.id ? updatedSeedEmail : se)))
            setEditingSeedEmail(null)
          }}
        />
      )}
      {editingRdp && (
        <EditRdpDialog
          rdp={editingRdp}
          isOpen={!!editingRdp}
          onOpenChange={(isOpen) => !isOpen && setEditingRdp(null)}
          onRdpUpdated={(updatedRdp: Rdp) => {
            setRdps((prev) => prev.map((r) => (r.id === updatedRdp.id ? updatedRdp : r)))
            setEditingRdp(null)
          }}
        />
      )}
      <DownloadSeedsDialog
        isOpen={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
        allSeedEmails={seedEmails}
        currentFilteredSeedEmails={filteredSeedEmailsByGroupName}
        availableGroupNames={availableGroupNamesForDownload}
      />
      <QuickAddRevenueDialog
        isOpen={isQuickAddRevenueDialogOpen}
        onOpenChange={setIsQuickAddRevenueDialogOpen}
        mailerId={currentUser.id}
        teamId={currentUser.team_id!}
        onRevenueLogged={handleRevenueLogged}
      />
      {/* NEW Edit Daily Revenue Dialog */}
      {editingDailyRevenue && (
        <EditDailyRevenueDialog
          dailyRevenue={editingDailyRevenue}
          isOpen={!!editingDailyRevenue}
          onOpenChange={(isOpen) => !isOpen && setEditingDailyRevenue(null)}
          onRevenueUpdated={handleRevenueUpdated}
        />
      )}
    </div>
  )
}
