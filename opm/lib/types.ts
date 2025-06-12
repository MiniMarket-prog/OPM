export type UserRole = "admin" | "team-leader" | "mailer" | "user" | "pending_approval"
export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export interface User {
  id: string
  name: string // This is the application-level display name.
  email?: string
  role: UserRole
  team_id?: string | null
  avatar_url?: string | null
  isp_focus?: string[] | null | undefined
  entry_date?: string | null
  age?: number | null
  address?: string | null
  phone?: string | null
  actual_salary?: number | null
  gender?: Gender | null
  teams?: Team | null
  created_at?: string
  updated_at?: string
  username?: string | null
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
  user_id?: string // ADDED: Link to the user who added it
  team_id: string
  status: "active" | "maintenance" | "problem" | "returned"
}

export interface SeedEmail {
  id: string
  email_address: string
  password_alias: string
  recovery_email?: string | null
  isp: string
  status: "active" | "warmup" | "banned" | "cooldown"
  added_by_mailer_id: string
  user_id?: string // ADDED: Link to the user who added it
  team_id: string
  entry_date?: string
  group_name?: string | null
}

export interface ProxyItem {
  id: string
  proxy_string: string
  added_by_mailer_id: string
  user_id?: string // ADDED: Link to the user who added it
  team_id: string
  status: "active" | "banned" | "slow" | "returned"
}

export interface Rdp {
  id: string
  ip_address: string // Explicit IP address field
  username: string // Explicit username field
  password_alias: string
  entry_date?: string | null // New: Entry date for the RDP
  added_by_mailer_id: string
  user_id?: string
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
