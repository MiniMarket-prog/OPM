"use client"

import type { MockDB, User, Team, Server, SeedEmail, ProxyItem, Rdp, DailyRevenue } from "@/lib/types" // Ensure Gender is imported if used in User pick
import { useState, useEffect } from "react"

const mockDB: MockDB = {
  users: [
    {
      id: "user-admin-0",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      avatar_url: "/admin-avatar.png",
    },
    {
      id: "user-mailer-test-profile",
      name: "Mailer Test Profile",
      email: "mailer.profile@example.com",
      role: "mailer",
      team_id: "team-A",
      isp_focus: ["Gmail"],
      entry_date: "2023-01-15",
      age: 28,
      address: "123 Main St, Anytown, USA",
      phone: "555-1234",
      actual_salary: 50000,
      gender: "female",
    },
  ],
  teams: [{ id: "team-A", name: "Alpha Operations - Initial" }],
  servers: [],
  seedEmails: [],
  proxies: [],
  rdps: [],
  dailyRevenues: [],
}

type Listener = (db: MockDB) => void
const listeners: Set<Listener> = new Set()

function notifyListeners() {
  listeners.forEach((listener: Listener) => listener(mockDB))
}

export function useMockDB(): [MockDB, typeof mockDBActions] {
  const [db, setDb] = useState<MockDB>(mockDB)

  useEffect(() => {
    const listener = (newDb: MockDB) => {
      setDb({ ...newDb })
    }
    listeners.add(listener)
    listener(mockDB)
    return () => {
      // Ensure cleanup returns void
      listeners.delete(listener)
    }
  }, [])

  return [db, mockDBActions]
}

export const mockDBActions = {
  getDB: (): MockDB => ({ ...mockDB }),
  addUser: (userData: Omit<User, "id">): User => {
    const newUser: User = { ...userData, id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}` }
    mockDB.users = [...mockDB.users, newUser]
    notifyListeners()
    return newUser
  },
  addTeam: (teamData: Omit<Team, "id">): Team => {
    const newTeam: Team = { ...teamData, id: `team-${Date.now()}-${Math.random().toString(16).slice(2)}` }
    mockDB.teams = [...mockDB.teams, newTeam]
    notifyListeners()
    return newTeam
  },
  addServer: (serverData: Omit<Server, "id" | "status">): Server => {
    const newServer: Server = {
      ...serverData,
      id: `server-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: "active",
    }
    mockDB.servers = [...mockDB.servers, newServer]
    notifyListeners()
    return newServer
  },
  addSeedEmail: (seedEmailData: Omit<SeedEmail, "id">): SeedEmail => {
    const newSeedEmail: SeedEmail = {
      ...seedEmailData,
      id: `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    }
    mockDB.seedEmails = [...mockDB.seedEmails, newSeedEmail]
    notifyListeners()
    return newSeedEmail
  },
  addMultipleSeedEmails: (seedEmailsData: Array<Omit<SeedEmail, "id">>): SeedEmail[] => {
    const newSeedEmails: SeedEmail[] = seedEmailsData.map((data: Omit<SeedEmail, "id">) => ({
      // Added type for data
      ...data,
      id: `seed-${Date.now()}-${Math.random().toString(16).slice(2)}-${data.email_address}`, // use email_address
    }))
    mockDB.seedEmails = [...mockDB.seedEmails, ...newSeedEmails]
    notifyListeners()
    return newSeedEmails
  },
  addProxy: (proxyData: Omit<ProxyItem, "id" | "status">): ProxyItem => {
    const newProxy: ProxyItem = {
      ...proxyData,
      id: `proxy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: "active",
    }
    mockDB.proxies = [...mockDB.proxies, newProxy]
    notifyListeners()
    return newProxy
  },
  addRdp: (rdpData: Omit<Rdp, "id" | "status">): Rdp => {
    const newRdp: Rdp = { ...rdpData, id: `rdp-${Date.now()}-${Math.random().toString(16).slice(2)}`, status: "active" }
    mockDB.rdps = [...mockDB.rdps, newRdp]
    notifyListeners()
    return newRdp
  },
  getCurrentUser: (userId: string): User | undefined => mockDB.users.find((u: User) => u.id === userId),

  updateUserProfile: (
    userId: string,
    profileData: Partial<
      Pick<User, "name" | "avatar_url" | "entry_date" | "age" | "address" | "phone" | "actual_salary" | "gender"> // Use avatar_url
    >,
  ): User | undefined => {
    const userIndex = mockDB.users.findIndex((u: User) => u.id === userId)
    if (userIndex !== -1) {
      const currentAge = mockDB.users[userIndex].age
      const currentSalary = mockDB.users[userIndex].actual_salary

      const newAge =
        profileData.age === undefined
          ? currentAge
          : Number.isNaN(Number(profileData.age))
            ? currentAge
            : Number(profileData.age)
      const newSalary =
        profileData.actual_salary === undefined
          ? currentSalary
          : Number.isNaN(Number(profileData.actual_salary))
            ? currentSalary
            : Number(profileData.actual_salary)

      mockDB.users[userIndex] = {
        ...mockDB.users[userIndex],
        ...profileData,
        age: profileData.age === undefined ? currentAge : profileData.age === null ? undefined : newAge,
        actual_salary:
          profileData.actual_salary === undefined
            ? currentSalary
            : profileData.actual_salary === null
              ? undefined
              : newSalary,
      }
      notifyListeners()
      return mockDB.users[userIndex]
    }
    return undefined
  },
  updateUserAvatar: (userId: string, avatarUrl: string): User | undefined => {
    const idx = mockDB.users.findIndex((u: User) => u.id === userId)
    if (idx !== -1) {
      mockDB.users[idx].avatar_url = avatarUrl // use avatar_url
      notifyListeners()
      return mockDB.users[idx]
    }
    return undefined
  },
  updateServerStatus: (serverId: string, status: Server["status"]): Server | undefined => {
    const idx = mockDB.servers.findIndex((s: Server) => s.id === serverId)
    if (idx !== -1) {
      mockDB.servers[idx].status = status
      notifyListeners()
      return mockDB.servers[idx]
    }
    return undefined
  },
  updateProxyStatus: (proxyId: string, status: ProxyItem["status"]): ProxyItem | undefined => {
    const idx = mockDB.proxies.findIndex((p: ProxyItem) => p.id === proxyId)
    if (idx !== -1) {
      mockDB.proxies[idx].status = status
      notifyListeners()
      return mockDB.proxies[idx]
    }
    return undefined
  },
  updateRdpStatus: (rdpId: string, status: Rdp["status"]): Rdp | undefined => {
    const idx = mockDB.rdps.findIndex((r: Rdp) => r.id === rdpId)
    if (idx !== -1) {
      mockDB.rdps[idx].status = status
      notifyListeners()
      return mockDB.rdps[idx]
    }
    return undefined
  },
  updateServer: (serverId: string, data: Partial<Pick<Server, "provider" | "ip_address">>): Server | undefined => {
    // use ip_address
    const serverIndex = mockDB.servers.findIndex((s: Server) => s.id === serverId)
    if (serverIndex !== -1) {
      mockDB.servers[serverIndex] = { ...mockDB.servers[serverIndex], ...data }
      notifyListeners()
      return mockDB.servers[serverIndex]
    }
    return undefined
  },
  addDailyRevenue: (revenueData: Omit<DailyRevenue, "id" | "created_at">): DailyRevenue => {
    const newRevenue: DailyRevenue = {
      ...revenueData,
      id: `rev-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      created_at: new Date().toISOString(),
    }
    mockDB.dailyRevenues = mockDB.dailyRevenues.filter(
      (r: DailyRevenue) => !(r.mailer_id === newRevenue.mailer_id && r.date === newRevenue.date),
    )
    mockDB.dailyRevenues = [...mockDB.dailyRevenues, newRevenue]
    mockDB.dailyRevenues.sort(
      (a: DailyRevenue, b: DailyRevenue) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    notifyListeners()
    return newRevenue
  },

  getRevenueForMailerForDate: (mailerId: string, date: string): DailyRevenue | undefined => {
    return mockDB.dailyRevenues.find((r: DailyRevenue) => r.mailer_id === mailerId && r.date === date)
  },
}
