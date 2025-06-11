"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useMockDB } from "@/lib/mock-data-store"
import type { SeedEmail, Server as ServerType, User, ProxyItem, Rdp, DailyRevenue, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { UserRoleSimulator } from "@/components/user-role-simulator"
import {
  PlusCircle,
  ServerIcon,
  Mail,
  ShieldCheck,
  MonitorPlay,
  Building,
  Upload,
  Download,
  Edit3,
  DollarSign,
  CalendarDays,
  ListChecks,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { EditServerDialog } from "@/components/edit-server-dialog"

const getFormattedDate = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

export default function MailerResourcesPage() {
  const [
    db,
    {
      addServer,
      addSeedEmail,
      addProxy,
      addRdp,
      getCurrentUser,
      addMultipleSeedEmails,
      addDailyRevenue,
      getRevenueForMailerForDate,
    },
  ] = useMockDB()
  const firstMailer = db.users.find((u: User) => u.role === "mailer")
  const [selectedUserId, setSelectedUserId] = useState<string>(firstMailer?.id || db.users[0]?.id || "")
  const currentUser = getCurrentUser(selectedUserId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedServerForEdit, setSelectedServerForEdit] = useState<ServerType | null>(null)

  const [serverProvider, setServerProvider] = useState("")
  const [serverIp, setServerIp] = useState("")
  const [seedEmailAddress, setSeedEmailAddress] = useState("")
  const [seedPasswordAlias, setSeedPasswordAlias] = useState("")
  const [seedRecoveryEmail, setSeedRecoveryEmail] = useState("")
  const [seedIsp, setSeedIsp] = useState("")
  const [seedStatus, setSeedStatus] = useState<SeedEmail["status"]>("warmup")
  const [proxyString, setProxyString] = useState("")
  const [rdpConnectionInfo, setRdpConnectionInfo] = useState("")
  const [rdpPasswordAlias, setRdpPasswordAlias] = useState("")

  const [revenueDate, setRevenueDate] = useState(getFormattedDate(-1))
  const [revenueAmount, setRevenueAmount] = useState("")

  const [listVersion, setListVersion] = useState(0)
  const forceRerenderServerList = () => setListVersion((v) => v + 1)

  useEffect(() => {
    if (currentUser) {
      const yesterday = getFormattedDate(-1)
      const revenueForYesterday = getRevenueForMailerForDate(currentUser.id, yesterday)
      if (revenueForYesterday) {
        setRevenueDate(getFormattedDate(0))
      } else {
        setRevenueDate(yesterday)
      }
      setRevenueAmount("")
    }
  }, [currentUser, getRevenueForMailerForDate])

  if (!currentUser || currentUser.role !== "mailer" || !currentUser.team_id) {
    return (
      <div className="container mx-auto p-4">
        <UserRoleSimulator
          currentUser={currentUser}
          allUsers={db.users}
          onUserChange={setSelectedUserId}
          className="mb-4"
        />
        <p>Access Denied. You must be a Mailer with an assigned team to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }
  const currentTeam = db.teams.find((t: Team) => t.id === currentUser.team_id)

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverProvider.trim() || !serverIp.trim()) return toast.error("Server provider and IP are required.")
    addServer({
      provider: serverProvider,
      ip_address: serverIp,
      added_by_mailer_id: currentUser.id,
      team_id: currentUser.team_id!,
    })
    setServerProvider("")
    setServerIp("")
    toast.success("Server added.")
  }
  const handleAddSeedEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!seedEmailAddress.trim() || !seedPasswordAlias.trim() || !seedIsp.trim())
      return toast.error("Email, password alias, and ISP are required for seed email.")
    addSeedEmail({
      email_address: seedEmailAddress,
      password_alias: seedPasswordAlias,
      recovery_email: seedRecoveryEmail.trim() || undefined,
      isp: seedIsp,
      status: seedStatus,
      added_by_mailer_id: currentUser.id,
      team_id: currentUser.team_id!,
    })
    setSeedEmailAddress("")
    setSeedPasswordAlias("")
    setSeedRecoveryEmail("")
    setSeedIsp("")
    setSeedStatus("warmup")
    toast.success("Seed email added.")
  }
  const handleAddProxy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proxyString.trim()) return toast.error("Proxy string is required.")
    addProxy({ proxy_string: proxyString, added_by_mailer_id: currentUser.id, team_id: currentUser.team_id! })
    setProxyString("")
    toast.success("Proxy added.")
  }
  const handleAddRdp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rdpConnectionInfo.trim() || !rdpPasswordAlias.trim())
      return toast.error("RDP connection info and password alias are required.")
    addRdp({
      connection_info: rdpConnectionInfo,
      password_alias: rdpPasswordAlias,
      added_by_mailer_id: currentUser.id,
      team_id: currentUser.team_id!,
    })
    setRdpConnectionInfo("")
    setRdpPasswordAlias("")
    toast.success("RDP added.")
  }
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "")
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredHeaders = ["emailaddress", "passwordalias", "isp", "status"] // these are fine as they are keys for parsing
      const missingHeaders = requiredHeaders.filter((rh) => !headers.includes(rh))
      if (missingHeaders.length > 0) {
        toast.error("Upload Error", { description: `Missing required CSV headers: ${missingHeaders.join(", ")}.` })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      const emailAddressIndex = headers.indexOf("emailaddress")
      const passwordAliasIndex = headers.indexOf("passwordalias")
      const recoveryEmailIndex = headers.indexOf("recoveryemail")
      const ispIndex = headers.indexOf("isp")
      const statusIndex = headers.indexOf("status")
      const newSeeds: Array<Omit<SeedEmail, "id">> = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",")
        const emailAddress = values[emailAddressIndex]?.trim()
        const passwordAlias = values[passwordAliasIndex]?.trim()
        const recoveryEmail = recoveryEmailIndex !== -1 ? values[recoveryEmailIndex]?.trim() : undefined
        const isp = values[ispIndex]?.trim()
        const status = values[statusIndex]?.trim() as SeedEmail["status"]
        if (
          emailAddress &&
          passwordAlias &&
          isp &&
          status &&
          ["active", "warmup", "banned", "cooldown"].includes(status)
        ) {
          newSeeds.push({
            email_address: emailAddress,
            password_alias: passwordAlias,
            recovery_email: recoveryEmail,
            isp,
            status,
            added_by_mailer_id: currentUser.id,
            team_id: currentUser.team_id!,
          })
        } else {
          toast.warning("Skipping Row", { description: `Invalid data in row: ${lines[i]}` })
        }
      }
      if (newSeeds.length > 0) {
        addMultipleSeedEmails(newSeeds)
        toast.success(`${newSeeds.length} seed emails imported.`)
      } else {
        toast.info("No valid seed emails found.")
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
    reader.readAsText(file)
  }
  const handleDownloadSeeds = () => {
    const mySeeds = db.seedEmails.filter((se: SeedEmail) => se.added_by_mailer_id === currentUser.id)
    if (mySeeds.length === 0) {
      toast.info("You have no seed emails to download.")
      return
    }
    const headers = "email_address,password_alias,recovery_email,isp,status\n" // Use snake_case for consistency if this CSV is for re-upload
    const csvContent = mySeeds
      .map(
        (seed: SeedEmail) =>
          `${seed.email_address},${seed.password_alias},${seed.recovery_email || ""},${seed.isp},${seed.status}`,
      )
      .join("\n")
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `my_seed_emails_${currentUser.name.replace(/\s+/g, "_")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Seed emails download started.")
    } else {
      toast.error("Download not supported.")
    }
  }

  const handleOpenEditDialog = (server: ServerType) => {
    setSelectedServerForEdit(server)
    setIsEditDialogOpen(true)
  }

  const handleAddRevenue = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number.parseFloat(revenueAmount)
    if (!revenueDate || isNaN(amount) || amount < 0) {
      toast.error("Valid date and positive revenue amount are required.")
      return
    }
    addDailyRevenue({
      mailer_id: currentUser.id,
      team_id: currentUser.team_id!,
      date: revenueDate,
      amount,
    })
    toast.success(`Revenue for ${revenueDate} logged.`)
    setRevenueAmount("")
    const yesterday = getFormattedDate(-1)
    const revenueForYesterday = getRevenueForMailerForDate(currentUser.id, yesterday)
    if (revenueForYesterday) setRevenueDate(getFormattedDate(0))
    else setRevenueDate(yesterday)
  }

  const myServers = db.servers.filter((s: ServerType) => s.added_by_mailer_id === currentUser.id)
  const mySeedEmails = db.seedEmails.filter((se: SeedEmail) => se.added_by_mailer_id === currentUser.id)
  const myProxies = db.proxies.filter((p: ProxyItem) => p.added_by_mailer_id === currentUser.id)
  const myRdps = db.rdps.filter((r: Rdp) => r.added_by_mailer_id === currentUser.id)
  const myRevenueEntries = db.dailyRevenues
    .filter((rev: DailyRevenue) => rev.mailer_id === currentUser.id)
    .sort((a: DailyRevenue, b: DailyRevenue) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UserRoleSimulator
        currentUser={currentUser}
        allUsers={db.users}
        onUserChange={setSelectedUserId}
        className="mb-6"
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Resources & Logs (Team: {currentTeam?.name || "N/A"})</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <Card className="mb-8" id="revenue-log">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" /> Daily Revenue Log
          </CardTitle>
          <CardDescription>Log your generated revenue for each day.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRevenue} className="grid md:grid-cols-3 gap-4 items-end mb-6">
            <div>
              <Label htmlFor="revenueDate" className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> Date
              </Label>
              <Input
                id="revenueDate"
                type="date"
                value={revenueDate}
                onChange={(e) => setRevenueDate(e.target.value)}
                max={getFormattedDate(0)}
              />
            </div>
            <div>
              <Label htmlFor="revenueAmount">Amount ($)</Label>
              <Input
                id="revenueAmount"
                type="number"
                step="0.01"
                min="0"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                placeholder="e.g., 150.75"
              />
            </div>
            <Button type="submit" className="self-end">
              <PlusCircle className="mr-2 h-4 w-4" /> Log Revenue
            </Button>
          </form>
          <h4 className="text-md font-semibold mb-2 flex items-center gap-1">
            <ListChecks className="h-4 w-4" /> My Revenue History (Last 7 entries)
          </h4>
          {myRevenueEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revenue logged yet.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {myRevenueEntries.slice(0, 7).map((rev: DailyRevenue) => (
                <li key={rev.id} className="text-sm p-1 border-b flex justify-between">
                  <span>{rev.date}:</span>
                  <span className="font-medium">${rev.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Bulk Seed Email Operations
          </CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple seed emails or download your current list.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="seed-upload" className="text-base font-medium">
              Upload Seed Emails CSV
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              CSV format: `emailAddress,passwordAlias,recoveryEmail,isp,status`. Header row required. `recoveryEmail` is
              optional.
            </p>
            <Input
              id="seed-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="mb-2"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Choose CSV File
            </Button>
          </div>
          <div>
            <Label className="text-base font-medium">Download My Seed Emails</Label>
            <p className="text-sm text-muted-foreground mb-2">Download all your added seed emails as a CSV file.</p>
            <Button onClick={handleDownloadSeeds} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-500" />
              Add Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddServer} className="space-y-3">
              <div>
                <Label htmlFor="serverProvider">Provider</Label>
                <Input
                  id="serverProvider"
                  value={serverProvider}
                  onChange={(e) => setServerProvider(e.target.value)}
                  placeholder="e.g., DigitalOcean"
                />
              </div>
              <div>
                <Label htmlFor="serverIp">IP Address</Label>
                <Input
                  id="serverIp"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                />
              </div>
              <Button type="submit" size="sm">
                Add Server
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-500" />
              Add Single Seed Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSeedEmail} className="space-y-3">
              <div>
                <Label htmlFor="seedEmailAddress">Email Address</Label>
                <Input
                  id="seedEmailAddress"
                  type="email"
                  value={seedEmailAddress}
                  onChange={(e) => setSeedEmailAddress(e.target.value)}
                  placeholder="e.g., seed@example.com"
                />
              </div>
              <div>
                <Label htmlFor="seedPasswordAlias">Password Alias</Label>
                <Input
                  id="seedPasswordAlias"
                  value={seedPasswordAlias}
                  onChange={(e) => setSeedPasswordAlias(e.target.value)}
                  placeholder="e.g., main_seed_pwd"
                />
              </div>
              <div>
                <Label htmlFor="seedRecoveryEmail">Recovery Email (Optional)</Label>
                <Input
                  id="seedRecoveryEmail"
                  type="email"
                  value={seedRecoveryEmail}
                  onChange={(e) => setSeedRecoveryEmail(e.target.value)}
                  placeholder="e.g., recovery@example.com"
                />
              </div>
              <div>
                <Label htmlFor="seedIsp">ISP</Label>
                <Input
                  id="seedIsp"
                  value={seedIsp}
                  onChange={(e) => setSeedIsp(e.target.value)}
                  placeholder="e.g., Gmail, Outlook"
                />
              </div>
              <div>
                <Label htmlFor="seedStatus">Status</Label>
                <Select value={seedStatus} onValueChange={(val: SeedEmail["status"]) => setSeedStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="warmup">Warmup</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="cooldown">Cooldown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm">
                Add Seed Email
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-purple-500" />
              Add Proxy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProxy} className="space-y-3">
              <div>
                <Label htmlFor="proxyString">Proxy String</Label>
                <Input
                  id="proxyString"
                  value={proxyString}
                  onChange={(e) => setProxyString(e.target.value)}
                  placeholder="e.g., ip:port:user:pass"
                />
              </div>
              <Button type="submit" size="sm">
                Add Proxy
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-orange-500" />
              Add RDP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRdp} className="space-y-3">
              <div>
                <Label htmlFor="rdpConnectionInfo">Connection Info</Label>
                <Input
                  id="rdpConnectionInfo"
                  value={rdpConnectionInfo}
                  onChange={(e) => setRdpConnectionInfo(e.target.value)}
                  placeholder="e.g., admin@192.168.1.101"
                />
              </div>
              <div>
                <Label htmlFor="rdpPasswordAlias">Password Alias</Label>
                <Input
                  id="rdpPasswordAlias"
                  value={rdpPasswordAlias}
                  onChange={(e) => setRdpPasswordAlias(e.target.value)}
                  placeholder="e.g., main_rdp_pwd"
                />
              </div>
              <Button type="submit" size="sm">
                Add RDP
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card key={`server-list-${listVersion}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5" />
              My Servers ({myServers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No servers added yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {myServers.map((s: ServerType) => (
                  <li
                    key={s.id}
                    className="text-sm p-2 border rounded-md bg-muted/30 flex justify-between items-center"
                  >
                    <div>
                      {s.ip_address} ({s.provider}) - <span className="capitalize">{s.status}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(s)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              My Seed Emails ({mySeedEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mySeedEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No seed emails added yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {mySeedEmails.map((se: SeedEmail) => (
                  <li key={se.id} className="text-sm p-2 border rounded-md bg-muted/30">
                    {se.email_address} ({se.isp} - {se.status})
                    {se.recovery_email && (
                      <span className="block text-xs text-muted-foreground">Recovery: {se.recovery_email}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              My Proxies ({myProxies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myProxies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No proxies added yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {myProxies.map((p: ProxyItem) => (
                  <li key={p.id} className="text-sm p-2 border rounded-md bg-muted/30">
                    {p.proxy_string} - <span className="capitalize">{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" />
              My RDPs ({myRdps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRdps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No RDPs added yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {myRdps.map((r: Rdp) => (
                  <li key={r.id} className="text-sm p-2 border rounded-md bg-muted/30">
                    {r.connection_info} (Pwd: {r.password_alias}) - <span className="capitalize">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <EditServerDialog
        server={selectedServerForEdit}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onServerUpdated={forceRerenderServerList}
      />
    </div>
  )
}
