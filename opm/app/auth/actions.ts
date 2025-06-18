"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import type { User, UserRole, ActionResult, Gender } from "@/lib/types"

// Define the state for the login action
interface LoginState extends ActionResult {
  // Inherit success, message, error from ActionResult
  // Add any specific state for login if needed
}

// Helper to get a Supabase client with service_role key for admin actions
function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.")
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function signIn(prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Email and password are required.", error: "Email and password are required." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign-in error:", error.message)
    return {
      success: false,
      message: error.message || "Could not authenticate user",
      error: error.message || "Could not authenticate user",
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        role: "pending_approval",
      },
    },
  })

  if (error) {
    console.error("Sign-up error:", error.message)
    redirect("/signup?message=Could not create user")
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: username,
      email: email,
      role: "pending_approval",
    })

    if (profileError) {
      console.error("Profile creation error:", profileError.message)
      redirect("/signup?message=Could not create user profile")
    }
  }

  revalidatePath("/", "layout")
  redirect("/login?message=Check email to verify account")
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign-out error:", error.message)
  }

  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Auth error in getUser:", authError.message)
    return null
  }

  if (!user) {
    console.log("No authenticated user found.")
    return null
  }

  // Select all columns from profiles and explicitly specify the foreign key relationship for 'teams'
  // Using '*' will fetch only the columns that actually exist in your database schema.
  const { data: profile, error: profileError } = await supabase
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
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return null
  }

  if (!profile) {
    console.log(`Profile not found for user: ${user.id}`)
    return null
  }

  // Map the fetched profile data to your User type, safely handling potentially missing properties.
  // Use optional chaining (?.) and nullish coalescing (?? null) for properties that might not exist
  // on the 'profile' object if your database schema is missing them, or if they are null.
  const mappedUser: User = {
    id: profile.id,
    name: profile.full_name ?? profile.username ?? "Unknown User", // Safely access full_name
    email: user.email, // Get email from auth.user
    role: profile.role as UserRole, // Cast to UserRole
    team_id: profile.team_id ?? null,
    avatar_url: profile.avatar_url ?? null,
    username: profile.username ?? null,
    full_name: profile.full_name ?? null, // Safely access full_name
    isp_focus: profile.isp_focus ?? null,
    entry_date: profile.entry_date ?? null,
    age: profile.age ?? null,
    address: profile.address ?? null,
    phone: profile.phone ?? null,
    actual_salary: profile.actual_salary ?? null,
    gender: (profile.gender as Gender | null) ?? null, // Cast and use nullish coalescing
    teams: profile.teams ?? null,
    created_at: profile.created_at ?? null,
    updated_at: profile.updated_at ?? null,
  }

  return mappedUser
}
