// SERVER COMPONENT: app/(dashboard)/mailer/profile/page.tsx
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MailerProfileClientPage from "./mailer-profile-client-page"
import type { User as UserAppType, Gender as UserGender } from "@/lib/types"
import type { Database } from "@/lib/database.types"
// Import SupabaseClient type directly
import type { SupabaseClient } from "@supabase/supabase-js"

export interface MailerProfileData extends UserAppType {
  team_name: string | null
}

// Adjust RawProfileFromDB and RawUserForSimulator to reflect actual DB column names
// and the structure of the embedded team data.
type RawProfileFromDB = Omit<Database["public"]["Tables"]["profiles"]["Row"], "team_id"> & {
  team_id: string | null
  teams: { name: string | null } | null // Embedded team data, now explicitly named 'teams'
}

type RawUserForSimulator = Omit<Database["public"]["Tables"]["profiles"]["Row"], "team_id"> & {
  team_id: string | null
  teams: { id: string | null; name: string | null } | null // Embedded team data
}

async function getAllUsersForSimulator(
  // CORRECTED TYPE: Use direct SupabaseClient<Database> type
  supabase: SupabaseClient<Database>,
): Promise<UserAppType[]> {
  // Use the explicit relationship hint provided by Supabase
  const { data: users, error } = await supabase.from("profiles").select("*, teams!fk_profiles_team_id(id, name)") // Using the explicit hint

  if (error) {
    console.error("Error fetching users for simulator:", error)
    return []
  }

  return (users as RawUserForSimulator[]).map((u) => ({
    id: u.id,
    // @ts-ignore - Assuming 'name' is the correct display name column on profiles
    name: u.name || u.username || "",
    email: undefined,
    role: u.role as UserAppType["role"],
    team_id: u.team_id,
    avatar_url: u.avatar_url,
    isp_focus: u.isp_focus as string[] | null | undefined,
    entry_date: u.entry_date,
    age: u.age,
    address: u.address,
    phone: u.phone,
    actual_salary: u.actual_salary,
    gender: u.gender as UserGender | null,
    created_at: undefined,
    updated_at: u.updated_at || undefined,
    username: u.username,
  }))
}

export default async function MailerProfileServerPage() {
  const cookieStore = await cookies()
  // AWAIT the supabase client creation
  const supabase = await createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options: any) => {
      cookieStore.set(name, value, options)
    },
    remove: (name: string, options: any) => {
      cookieStore.delete({ name, ...options })
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/login?message=Authentication required.")
  }

  // Use the explicit relationship hint provided by Supabase
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(`*, teams!fk_profiles_team_id(name)`) // Using the explicit hint
    .eq("id", session.user.id)
    .single()

  if (profileError || !profileData) {
    console.error("Error fetching mailer profile:", profileError?.message || "Profile data is null.")
    if (profileError) console.error(profileError) // Log the full error object
    redirect("/dashboard?error=Failed to load profile.")
  }

  const profile = profileData as RawProfileFromDB

  if (profile.role !== "mailer") {
    redirect("/dashboard?error=Access Denied. Mailer role required.")
  }

  // AWAIT the getAllUsersForSimulator call
  const allUsersForSimulator = await getAllUsersForSimulator(supabase)

  const initialProfileData: MailerProfileData = {
    id: profile.id,
    // @ts-ignore - Assuming 'name' is the correct display name column on profiles
    name: profile.name || profile.username || "",
    email: session.user.email || "",
    avatar_url: profile.avatar_url,
    role: profile.role as UserAppType["role"],
    team_id: profile.team_id,
    team_name: profile.teams?.name ?? null, // Access embedded team name via 'teams'
    isp_focus: profile.isp_focus as string[] | null | undefined,
    entry_date: profile.entry_date,
    age: profile.age,
    address: profile.address,
    phone: profile.phone,
    actual_salary: profile.actual_salary,
    gender: profile.gender as UserGender | null,
    created_at: session.user.created_at || undefined,
    updated_at: profile.updated_at || undefined,
    username: profile.username,
  }

  return <MailerProfileClientPage initialProfile={initialProfileData} allUsers={allUsersForSimulator} />
}
