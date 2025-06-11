export type UserRole = "admin" | "team-leader" | "mailer" | "user" | "pending_approval"
export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export interface User {
  id: string
  name: string
  email?: string
  role: UserRole
  team_id?: string
  avatar_url?: string
  isp_focus?: string[]
  entry_date?: string
  age?: number
  address?: string
  phone?: string
  actual_salary?: number
  gender?: Gender
  teams?: Team | null // Added for consistency with dashboard page if needed elsewhere
}

export interface Team {
  id: string
  name: string
  created_at?: string
}

export interface Server {
  id: string
  provider: string
  ip_address: string
  added_by_mailer_id: string
  team_id: string
  status: "active" | "maintenance" | "problem" | "returned"
}

export interface SeedEmail {
  id: string
  email_address: string
  password_alias: string
  recovery_email?: string
  isp: string
  status: "active" | "warmup" | "banned" | "cooldown"
  added_by_mailer_id: string
  team_id: string
}

export interface ProxyItem {
  id: string
  proxy_string: string
  added_by_mailer_id: string
  team_id: string
  status: "active" | "banned" | "slow" | "returned"
}

export interface Rdp {
  id: string
  connection_info: string
  password_alias: string
  added_by_mailer_id: string
  team_id: string
  status: "active" | "problem" | "returned"
}

export interface DailyRevenue {
  id: string
  mailer_id: string
  team_id: string
  date: string
  amount: number
  created_at: string
}

export interface MockDB {
  users: User[]
  teams: Team[]
  servers: Server[]
  seedEmails: SeedEmail[]
  proxies: ProxyItem[]
  rdps: Rdp[]
  dailyRevenues: DailyRevenue[]
}

export interface AppState {
  currentUser: User
  users: User[]
  teams: Team[]
  servers: Server[]
  seedEmails: SeedEmail[]
  proxies: ProxyItem[]
  rdps: Rdp[]
  dailyRevenues: DailyRevenue[]
}

export interface Proxy extends ProxyItem {}
