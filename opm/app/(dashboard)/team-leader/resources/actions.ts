"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { Server, ProxyItem, SeedEmail, Rdp, User } from "@/lib/types"

// Helper to get a Supabase client with user session
async function getSupabaseClientWithUser() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        /* Ignored */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options })
      } catch (error) {
        /* Ignored */
      }
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase: null, user: null, error: "User not authenticated." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, team_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { supabase, user, error: "Could not fetch user profile." }
  }

  if (profile.role !== "team-leader" || !profile.team_id) {
    return { supabase, user, error: "User does not have Team Leader privileges or is not assigned to a team." }
  }

  return { supabase, user, profile, error: null }
}

export async function getServersForTeam(
  teamId: string,
  mailerId: string | null = null,
): Promise<{ data: Server[] | null; error: string | null }> {
  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { data: null, error: authError || "Authentication failed." }
  }

  let query = supabase.from("servers").select("*").eq("team_id", teamId)
  if (mailerId) {
    query = query.eq("user_id", mailerId)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error("Error fetching servers for team:", dbError)
    return { data: null, error: dbError.message }
  }
  return { data: data as Server[], error: null }
}

export async function getProxiesForTeam(
  teamId: string,
  mailerId: string | null = null,
): Promise<{ data: ProxyItem[] | null; error: string | null }> {
  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { data: null, error: authError || "Authentication failed." }
  }

  let query = supabase.from("proxies").select("*").eq("team_id", teamId)
  if (mailerId) {
    query = query.eq("user_id", mailerId)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error("Error fetching proxies for team:", dbError)
    return { data: null, error: dbError.message }
  }
  return { data: data as ProxyItem[], error: null }
}

export async function getSeedEmailsForTeam(
  teamId: string,
  mailerId: string | null = null,
): Promise<{ data: SeedEmail[] | null; error: string | null }> {
  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { data: null, error: authError || "Authentication failed." }
  }

  let query = supabase.from("seed_emails").select("*").eq("team_id", teamId)
  if (mailerId) {
    query = query.eq("user_id", mailerId)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error("Error fetching seed emails for team:", dbError)
    return { data: null, error: dbError.message }
  }
  return { data: data as SeedEmail[], error: null }
}

export async function getRdpsForTeam(
  teamId: string,
  mailerId: string | null = null,
): Promise<{ data: Rdp[] | null; error: string | null }> {
  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { data: null, error: authError || "Authentication failed." }
  }

  let query = supabase.from("rdps").select("*").eq("team_id", teamId)
  if (mailerId) {
    query = query.eq("user_id", mailerId)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error("Error fetching RDPs for team:", dbError)
    return { data: null, error: dbError.message }
  }
  return { data: data as Rdp[], error: null }
}

export async function getMailersForTeam(teamId: string): Promise<{ data: User[] | null; error: string | null }> {
  const { supabase, error: authError } = await getSupabaseClientWithUser()
  if (authError || !supabase) {
    return { data: null, error: authError || "Authentication failed." }
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select(
      "id, name, email, role, team_id, avatar_url, isp_focus, entry_date, age, address, phone, actual_salary, gender, username",
    )
    .eq("role", "mailer")
    .eq("team_id", teamId)

  if (dbError) {
    console.error("Error fetching mailers for team:", dbError)
    return { data: null, error: dbError.message }
  }
  return { data: data as User[], error: null }
}
