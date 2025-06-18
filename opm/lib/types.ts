import type { Database } from "./database.types"

export type UserRole = "admin" | "team-leader" | "mailer" | "pending_approval"
export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export type User = {
  id: string
  name: string // This is the application-level display name (can be full_name or username).
  email?: string | null
  role: UserRole
  team_id?: string | null
  avatar_url?: string | null
  username?: string | null
  full_name?: string | null // Added full_name
  isp_focus?: string[] | null
  entry_date?: string | null
  age?: number | null
  address?: string | null
  phone?: string | null
  actual_salary?: number | null
  gender?: Gender | null // Ensure this is Gender type
  teams?: Team | null // Added teams relation to User type
  created_at?: string | null // Changed to allow null
  updated_at?: string | null // Changed to allow null
}

export type Team = Database["public"]["Tables"]["teams"]["Row"]

export type Server = Database["public"]["Tables"]["servers"]["Row"]

export type ProxyItem = Database["public"]["Tables"]["proxies"]["Row"]

export type SeedEmail = Database["public"]["Tables"]["seed_emails"]["Row"]

export type Rdp = Database["public"]["Tables"]["rdps"]["Row"]

export type DailyRevenue = Database["public"]["Tables"]["daily_revenues"]["Row"]

// Define a generic ActionResult type for Server Actions
export type ActionResult<T = void> = {
  success: boolean
  message: string // Ensure message is always present
  data?: T
  error?: string
}

export type ResourceReturnItem = {
  id: string
  ip_address: string
  status: string
  user_id: string | null
  connection_info?: string | null
  profiles?: { full_name: string | null }[] | null // Changed to array of profiles
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
