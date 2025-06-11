import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User, Team, Server as ServerType, SeedEmail, ProxyItem, Rdp } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Users,
  ServerIcon as ServerLucideIcon,
  Mail,
  ShieldCheck,
  MonitorPlay,
  Building,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Cell,
} from "recharts"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr" // Import for typing

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82Ca9D"]

interface StatsData {
  serversPerTeam: Array<{ name: string; count: number }>
  mailersPerTeam: Array<{ name: string; count: number }>
  teamLeadersPerTeam: Array<{ name: string; count: number }>
  seedEmailStatusChartData: Array<{ name: string; value: number }>
  proxiesPerTeam: Array<{ name: string; count: number }>
  rdpsPerTeam: Array<{ name: string; count: number }>
  serverStatus: Array<{ name: string; value: number }>
  proxyStatus: Array<{ name: string; value: number }>
  rdpStatus: Array<{ name: string; value: number }>
  totalTeams: number
  totalUsers: number
  totalTLs: number
  totalMailers: number
  totalServers: number
  totalSeedEmails: number
  totalProxies: number
  totalRdps: number
  allUsersForSimulator: User[]
  currentSimulatedUser?: User
  error?: string
}

function getDefaultStatsData(errorMsg?: string, allUsers: User[] = []): StatsData {
  return {
    serversPerTeam: [],
    mailersPerTeam: [],
    teamLeadersPerTeam: [],
    seedEmailStatusChartData: [],
    proxiesPerTeam: [],
    rdpsPerTeam: [],
    serverStatus: [],
    proxyStatus: [],
    rdpStatus: [],
    totalTeams: 0,
    totalUsers: 0,
    totalTLs: 0,
    totalMailers: 0,
    totalServers: 0,
    totalSeedEmails: 0,
    totalProxies: 0,
    totalRdps: 0,
    allUsersForSimulator: allUsers,
    error: errorMsg,
  }
}

async function getStatsData(supabaseClient: ReturnType<typeof createSupabaseServerClient>): Promise<StatsData> {
  // supabaseClient is already an initialized client here
  try {
    const { data: teamsData, error: teamsError } = await supabaseClient.from("teams").select("*")
    if (teamsError) throw teamsError
    const teams = (teamsData as Team[]) || []

    const { data: usersData, error: usersError } = await supabaseClient.from("profiles").select("*")
    if (usersError) throw usersError
    const users = (usersData as User[]) || []

    const { data: serversData, error: serversError } = await supabaseClient.from("servers").select("*")
    if (serversError) throw serversError
    const servers = (serversData as ServerType[]) || []

    const { data: seedEmailsData, error: seedEmailsError } = await supabaseClient.from("seed_emails").select("*")
    if (seedEmailsError) throw seedEmailsError
    const seedEmails = (seedEmailsData as SeedEmail[]) || []

    const { data: proxiesData, error: proxiesError } = await supabaseClient.from("proxies").select("*")
    if (proxiesError) throw proxiesError
    const proxies = (proxiesData as ProxyItem[]) || []

    const { data: rdpsData, error: rdpsError } = await supabaseClient.from("rdps").select("*")
    if (rdpsError) throw rdpsError
    const rdps = (rdpsData as Rdp[]) || []

    // ... (rest of the data processing logic remains the same)
    const serversPerTeam = teams.map((team) => ({
      name: team.name,
      count: servers.filter((s) => s.team_id === team.id && s.status === "active").length,
    }))
    const mailersPerTeam = teams.map((team) => ({
      name: team.name,
      count: users.filter((u) => u.role === "mailer" && u.team_id === team.id).length,
    }))
    const teamLeadersPerTeam = teams.map((team) => ({
      name: team.name,
      count: users.filter((u) => u.role === "team-leader" && u.team_id === team.id).length,
    }))
    const seedEmailStatusDistribution = Object.groupBy(seedEmails, (item) => item.status) as Record<string, SeedEmail[]>
    const seedEmailStatusChartData = Object.entries(seedEmailStatusDistribution).map(([status, emailList]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: emailList.length,
    }))
    const proxiesPerTeam = teams.map((team) => ({
      name: team.name,
      count: proxies.filter((p) => p.team_id === team.id && p.status === "active").length,
    }))
    const rdpsPerTeam = teams.map((team) => ({
      name: team.name,
      count: rdps.filter((r) => r.team_id === team.id && r.status === "active").length,
    }))
    const resourceStatus = (resourceList: Array<{ status: string }>) => {
      const active = resourceList.filter((r) => r.status === "active").length
      const returned = resourceList.filter((r) => r.status === "returned").length
      const problem = resourceList.filter(
        (r) => r.status === "problem" || r.status === "maintenance" || r.status === "banned" || r.status === "slow",
      ).length
      return [
        { name: "Active", value: active },
        { name: "Returned", value: returned },
        { name: "Problem/Other", value: problem },
      ]
    }

    return {
      serversPerTeam,
      mailersPerTeam,
      teamLeadersPerTeam,
      seedEmailStatusChartData,
      proxiesPerTeam,
      rdpsPerTeam,
      serverStatus: resourceStatus(servers),
      proxyStatus: resourceStatus(proxies),
      rdpStatus: resourceStatus(rdps),
      totalTeams: teams.length,
      totalUsers: users.length,
      totalTLs: users.filter((u) => u.role === "team-leader").length,
      totalMailers: users.filter((u) => u.role === "mailer").length,
      totalServers: servers.length,
      totalSeedEmails: seedEmails.length,
      totalProxies: proxies.length,
      totalRdps: rdps.length,
      allUsersForSimulator: users,
    }
  } catch (error) {
    console.error("Error fetching stats data:", error)
    // Fallback to fetch allUsers if primary data fetch fails, to ensure UserRoleSimulator can populate
    const { data: allUsersDataFallback } = await supabaseClient.from("profiles").select("*")
    const allUsers = (allUsersDataFallback as User[]) || []
    return getDefaultStatsData(error instanceof Error ? error.message : "Unknown error fetching stats.", allUsers)
  }
}

export default async function AdminStatsPage({ searchParams }: { searchParams?: { simulatedUserId?: string } }) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Middleware handling */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        /* Middleware handling */
      }
    },
  })

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login")
  }

  const { data: authUserProfileData, error: authProfileError } = await supabase
    .from("profiles")
    .select("*, teams(id, name)")
    .eq("id", authUser.id)
    .single()

  if (authProfileError || !authUserProfileData) {
    console.error("Auth profile error:", authProfileError)
    return (
      <div className="container mx-auto p-4">
        <p>Error fetching your profile. Please try again.</p>
      </div>
    )
  }
  const authUserProfile = authUserProfileData as User & { teams: Team | null }

  if (authUserProfile.role !== "admin") {
    return (
      <div className="container mx-auto p-4">
        <p>Access Denied. You must be an Admin to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const statsData = await getStatsData(supabase) // Pass the initialized client

  const usersForSimulator: User[] = statsData.allUsersForSimulator
  const displayUserForSimulator: User =
    usersForSimulator.find((u) => u.id === (searchParams?.simulatedUserId || authUser.id)) || (authUserProfile as User)

  if (statsData.error && !Object.values(statsData).some((val) => Array.isArray(val) && val.length > 0)) {
    return (
      <div className="container mx-auto p-4">
        <p>Could not load statistics data: {statsData.error}</p>
      </div>
    )
  }

  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-1))" },
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize="10px">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Displaying stats for: {authUserProfile.name} (Admin)</p>
        {statsData.error && (
          <p className="text-sm text-red-500">Note: Some data might be incomplete due to an error: {statsData.error}</p>
        )}
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" /> Statistics Overview
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </div>
      {/* ... (rest of the JSX for displaying stats remains the same) ... */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalTeams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              TLs: {statsData.totalTLs}, Mailers: {statsData.totalMailers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalServers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Seed Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalSeedEmails}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalProxies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total RDPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalRdps}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerLucideIcon className="h-5 w-5" /> Active Servers per Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsData.serversPerTeam.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart data={statsData.serversPerTeam} layout="vertical" margin={{ right: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} name="Active Servers" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No server data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Seed Email Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statsData.seedEmailStatusChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full max-w-xs">
                <RechartsPieChart>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statsData.seedEmailStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {statsData.seedEmailStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No seed email data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Mailers per Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsData.mailersPerTeam.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart data={statsData.mailersPerTeam} margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} name="Mailers" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No mailer data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Team Leaders per Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsData.teamLeadersPerTeam.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart data={statsData.teamLeadersPerTeam} margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} name="Team Leaders" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No team leader data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Active Proxies per Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsData.proxiesPerTeam.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart data={statsData.proxiesPerTeam} layout="vertical" margin={{ right: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} name="Active Proxies" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No proxy data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" /> Active RDPs per Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsData.rdpsPerTeam.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart data={statsData.rdpsPerTeam} layout="vertical" margin={{ right: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} name="Active RDPs" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No RDP data to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerLucideIcon className="h-5 w-5" /> Server Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statsData.serverStatus.some((s) => s.value > 0) ? (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full max-w-xs">
                <RechartsPieChart>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statsData.serverStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {statsData.serverStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No server status data.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Proxy Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statsData.proxyStatus.some((s) => s.value > 0) ? (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full max-w-xs">
                <RechartsPieChart>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statsData.proxyStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {statsData.proxyStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No proxy status data.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" /> RDP Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {statsData.rdpStatus.some((s) => s.value > 0) ? (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full max-w-xs">
                <RechartsPieChart>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statsData.rdpStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {statsData.rdpStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No RDP status data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
