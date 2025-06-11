import type { AppState, User, Team, Server, SeedEmail, ProxyItem, Rdp } from "@/lib/types" // Changed Proxy to ProxyItem

const users: User[] = [
  { id: "user-admin", name: "Admin User", role: "admin" },
  { id: "user-tl1-teamA", name: "Team Leader Alice", role: "team-leader", team_id: "team-A" },
  { id: "user-tl2-teamA", name: "Team Leader Aaron", role: "team-leader", team_id: "team-A" },
  { id: "user-tl1-teamB", name: "Team Leader Bob", role: "team-leader", team_id: "team-B" },
  { id: "user-mailer1-teamA", name: "Mailer Charlie", role: "mailer", team_id: "team-A", isp_focus: ["Gmail"] },
  { id: "user-mailer2-teamA", name: "Mailer Carol", role: "mailer", team_id: "team-A", isp_focus: ["Outlook"] },
  { id: "user-mailer1-teamB", name: "Mailer David", role: "mailer", team_id: "team-B", isp_focus: ["Yahoo"] },
]

const teams: Team[] = [
  { id: "team-A", name: "Alpha Operations" },
  { id: "team-B", name: "Bravo Senders" },
  { id: "team-C", name: "Charlie Warmers" },
]

const servers: Server[] = [
  {
    id: "server-1",
    provider: "DigitalOcean",
    ip_address: "192.0.2.1",
    team_id: "team-A",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
  {
    id: "server-2",
    provider: "AWS",
    ip_address: "198.51.100.5",
    team_id: "team-A",
    added_by_mailer_id: "user-mailer1-teamA", // Assuming mailer can add, or should be TL/Admin
    status: "active",
  },
  {
    id: "server-3",
    provider: "Vultr",
    ip_address: "203.0.113.10",
    team_id: "team-B",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
  {
    id: "server-4",
    provider: "Hetzner",
    ip_address: "192.0.2.2",
    team_id: "team-A",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
  {
    id: "server-5",
    provider: "OVH",
    ip_address: "198.51.100.6",
    team_id: "team-C",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
]

const seedEmails: SeedEmail[] = [
  {
    id: "email-1",
    email_address: "seed1@example.com",
    password_alias: "pwd1",
    isp: "Gmail",
    status: "active",
    team_id: "team-A",
    added_by_mailer_id: "user-mailer1-teamA",
  },
  {
    id: "email-2",
    email_address: "seed2@example.com",
    password_alias: "pwd2",
    isp: "Outlook",
    status: "warmup",
    team_id: "team-A",
    added_by_mailer_id: "user-admin",
  },
  {
    id: "email-3",
    email_address: "seed3@example.com",
    password_alias: "pwd3",
    isp: "Yahoo",
    status: "active",
    team_id: "team-B",
    added_by_mailer_id: "user-mailer1-teamB",
  },
  {
    id: "email-4",
    email_address: "seed4@example.com",
    password_alias: "pwd4",
    isp: "Gmail",
    status: "cooldown",
    team_id: "team-A",
    added_by_mailer_id: "user-admin",
  },
]

const proxies: ProxyItem[] = [
  // Changed Proxy to ProxyItem
  {
    id: "proxy-1",
    proxy_string: "1.2.3.4:8080",
    team_id: "team-A",
    added_by_mailer_id: "user-mailer1-teamA",
    status: "active",
  },
  {
    id: "proxy-2",
    proxy_string: "5.6.7.8:3128:user:pass",
    team_id: "team-A",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
  {
    id: "proxy-3",
    proxy_string: "9.10.11.12:1080",
    team_id: "team-B",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
]

const rdps: Rdp[] = [
  {
    id: "rdp-1",
    connection_info: "admin@10.0.0.1",
    password_alias: "rdp_pwd1",
    team_id: "team-A",
    added_by_mailer_id: "user-mailer1-teamA",
    status: "active",
  },
  {
    id: "rdp-2",
    connection_info: "user@10.0.0.2",
    password_alias: "rdp_pwd2",
    team_id: "team-B",
    added_by_mailer_id: "user-admin",
    status: "active",
  },
]

export const getInitialAppState = (currentUserId: string): AppState => {
  const currentUser = users.find((u: User) => u.id === currentUserId)
  if (!currentUser) throw new Error("User not found")

  // For AppState, we might still use camelCase if it's purely for client-side state
  // and not direct DB mapping. However, for consistency with `lib/types.ts` which
  // is now strictly snake_case for DB-like fields, it's better to be consistent.
  // The AppState type itself uses snake_case types from lib/types.ts.
  // So, the mock data here should also align.
  // The `dailyRevenues` field was missing from AppState and mockDB types.
  // I've added it to `lib/types.ts` and will add it here.

  return {
    currentUser,
    users,
    teams,
    servers,
    seedEmails,
    proxies,
    rdps,
    dailyRevenues: [], // Add empty dailyRevenues for initial state
  }
}
