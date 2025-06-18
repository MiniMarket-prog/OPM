"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { User, ActionResult, Gender } from "@/lib/types"

interface TeamLeaderProfileData {
  currentUser: User | null
  teamMembers: User[]
}

export async function getTeamLeaderProfileData(): Promise<TeamLeaderProfileData> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login")
  }

  // Fetch the current user's profile (Team Leader)
  const { data: currentUserProfile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      *,
      teams!fk_profiles_team_id(
        id,
        name,
        created_at
      )
    `,
    )
    .eq("id", authUser.id)
    .single()

  if (profileError || !currentUserProfile) {
    console.error("Error fetching current user profile:", profileError)
    redirect("/login?message=Profile not found or error fetching profile")
  }

  type UserRole = "admin" | "team-leader" | "mailer"

  const currentUser: User = {
    id: currentUserProfile.id,
    name: currentUserProfile.full_name ?? currentUserProfile.username ?? "Unknown User",
    email: authUser.email,
    role: currentUserProfile.role as UserRole,
    team_id: currentUserProfile.team_id ?? null,
    avatar_url: currentUserProfile.avatar_url ?? null,
    username: currentUserProfile.username ?? null,
    full_name: currentUserProfile.full_name ?? null,
    isp_focus: currentUserProfile.isp_focus ?? null,
    entry_date: currentUserProfile.entry_date ?? null,
    age: currentUserProfile.age ?? null,
    address: currentUserProfile.address ?? null,
    phone: currentUserProfile.phone ?? null,
    actual_salary: currentUserProfile.actual_salary ?? null,
    gender: (currentUserProfile.gender as Gender | null) ?? null,
    teams: currentUserProfile.teams ?? null,
    created_at: currentUserProfile.created_at ?? null,
    updated_at: currentUserProfile.updated_at ?? null,
  }

  if (currentUser.role !== "team-leader" && currentUser.role !== "admin") {
    redirect("/dashboard?message=Access Denied")
  }

  // Fetch team members (mailers) associated with this team leader's team_id
  let teamMembers: User[] = []
  if (currentUser.team_id) {
    const { data: mailersData, error: mailersError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        full_name,
        email,
        role,
        team_id,
        avatar_url,
        isp_focus,
        entry_date,
        age,
        address,
        phone,
        actual_salary,
        gender,
        created_at,
        updated_at
      `,
      )
      .eq("team_id", currentUser.team_id)
      .eq("role", "mailer") // Only fetch mailers
      .order("username", { ascending: true })

    if (mailersError) {
      console.error("Error fetching team mailers:", mailersError)
    } else if (mailersData) {
      teamMembers = mailersData.map((mailer) => ({
        id: mailer.id,
        name: mailer.full_name ?? mailer.username ?? "Unknown Mailer",
        email: mailer.email,
        role: mailer.role as UserRole,
        team_id: mailer.team_id,
        avatar_url: mailer.avatar_url,
        username: mailer.username,
        full_name: mailer.full_name,
        isp_focus: mailer.isp_focus,
        entry_date: mailer.entry_date,
        age: mailer.age,
        address: mailer.address,
        phone: mailer.phone,
        actual_salary: mailer.actual_salary,
        gender: mailer.gender as Gender | null,
        created_at: mailer.created_at,
        updated_at: mailer.updated_at,
      }))
    }
  }

  return { currentUser, teamMembers }
}

export async function updateTeamLeaderProfile(
  prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "User not authenticated.", error: "User not authenticated." }
  }

  const full_name = formData.get("full_name") as string
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const isp_focus = formData.getAll("isp_focus") as string[]
  const entry_date = formData.get("entry_date") as string
  const age = Number.parseInt(formData.get("age") as string)
  const address = formData.get("address") as string
  const phone = formData.get("phone") as string
  const actual_salary = Number.parseFloat(formData.get("actual_salary") as string)
  const gender = formData.get("gender") as Gender

  const updateData: Partial<User> = {
    full_name,
    username,
    isp_focus,
    entry_date,
    age: isNaN(age) ? null : age,
    address,
    phone,
    actual_salary: isNaN(actual_salary) ? null : actual_salary,
    gender,
    updated_at: new Date().toISOString(),
  }

  const { error: profileUpdateError } = await supabase.from("profiles").update(updateData).eq("id", user.id)

  if (profileUpdateError) {
    console.error("Error updating team leader profile:", profileUpdateError)
    return { success: false, message: "Failed to update profile.", error: profileUpdateError.message }
  }

  // If email is changed, update auth email
  if (user.email !== email) {
    const { error: emailUpdateError } = await supabase.auth.updateUser({ email })
    if (emailUpdateError) {
      console.error("Error updating user email:", emailUpdateError)
      return { success: false, message: "Failed to update email.", error: emailUpdateError.message }
    }
  }

  revalidatePath("/team-leader/profile")
  return { success: true, message: "Profile updated successfully!" }
}
