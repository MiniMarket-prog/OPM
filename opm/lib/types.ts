import type { Database } from "./database.types"

export type UserRole = "admin" | "team-leader" | "mailer" | "pending_approval"
export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export type User = {
  id: string
  name: string | null // Changed to allow null
  email?: string | null
  role: string | null // CRITICAL CHANGE: Allow role to be string | null to match Supabase
  team_id?: string | null
  avatar_url?: string | null
  username?: string | null // Changed to allow null
  full_name?: string | null
  isp_focus?: string[] | null
  entry_date?: string | null
  age?: number | null
  address?: string | null
  phone?: string | null
  actual_salary?: number | null
  gender?: string | null // CRITICAL CHANGE: Allow gender to be string | null
  teams?: Team | null
  created_at?: string | null
  updated_at?: string | null
}

export type Team = Database["public"]["Tables"]["teams"]["Row"]

// Extend Server, ProxyItem, and Rdp to include the joined profile data
export type Server = Database["public"]["Tables"]["servers"]["Row"] & {
  profiles?: { full_name: string | null; name: string | null; username: string | null } | null // CRITICAL CHANGE: Added name and username
}

export type ProxyItem = Database["public"]["Tables"]["proxies"]["Row"] & {
  profiles?: { full_name: string | null; name: string | null; username: string | null } | null // CRITICAL CHANGE: Added name and username
}

export type SeedEmail = Database["public"]["Tables"]["seed_emails"]["Row"] & {
  profiles?: { full_name: string | null; name: string | null; username: string | null } | null // CRITICAL CHANGE: Added name and username
}

export type Rdp = Database["public"]["Tables"]["rdps"]["Row"] & {
  profiles?: { full_name: string | null; name: string | null; username: string | null } | null // CRITICAL CHANGE: Added name and username
}

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
  profiles?: { full_name: string | null }[] | null // This type is for the specific ResourceReturnItem, not the joined data from the DB
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
