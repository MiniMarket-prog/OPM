"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies, headers as nextHeaders } from "next/headers"
import { redirect } from "next/navigation"
import type { CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

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

export async function signOut() {
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

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error)
  }

  revalidatePath("/", "layout")
  redirect("/login")
}

export async function signUpWithIpCheck(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." }
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." }
  }

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

  const h = await nextHeaders()
  const xForwardedFor = h.get("x-forwarded-for")
  const clientIp = xForwardedFor ? xForwardedFor.split(",")[0].trim() : h.get("remote-addr")

  if (clientIp) {
    const { data: whitelistedIps, error: ipError } = await supabase
      .from("allowed_signup_ips")
      .select("ip_address", { count: "exact" })

    if (ipError) {
      console.error("Error checking IP whitelist:", ipError)
      return { error: "Server error checking IP whitelist. Please try again." }
    }

    if (whitelistedIps && whitelistedIps.length > 0) {
      const isIpAllowed = whitelistedIps.some((ipObj) => ipObj.ip_address === clientIp)
      if (!isIpAllowed) {
        return { error: "Sign-ups from your current IP address are not permitted." }
      }
    }
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name },
    },
  })

  if (signUpError) {
    console.error("Sign-up error:", signUpError)
    return { error: signUpError.message || "An unexpected error occurred during sign-up." }
  }

  if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
    return {
      error:
        "This email address may already be in use or sign-ups are currently disabled. Please check your email or contact support.",
    }
  }

  revalidatePath("/admin/user-approval")
  return {
    error: null,
    success: true,
    message:
      "Please check your email to confirm your account. You will be able to log in after an admin approves your account.",
  }
}

// Define the state for the login action
interface LoginState {
  error?: string | null
  success?: boolean
  message?: string | null
}

export async function login(prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

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

  const { error: signInError, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    console.error("Login error:", signInError)
    if (signInError.message.includes("Email not confirmed")) {
      return {
        error:
          "Please confirm your email address before logging in. If your account requires approval, please wait for an administrator to approve it.",
      }
    }
    return { error: signInError.message || "Invalid login credentials." }
  }

  if (!data.session) {
    // This case might happen if user is not approved yet or other auth rules prevent session creation
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()
    if (profile && profile.role === "pending_approval") {
      return { error: "Your account is awaiting admin approval. Please try again later." }
    }
    return { error: "Login failed. Please check your credentials or account status." }
  }

  // Revalidate relevant paths and redirect
  revalidatePath("/", "layout") // Revalidate all to update auth state everywhere
  redirect("/dashboard") // This will be caught by useFormState, so we might not see a success message if redirect happens.
  // For actions that redirect, it's common not to return a success message directly from the action.
  // The redirect itself signifies success.
  // Unreachable code due to redirect, but good for type consistency if redirect was conditional
  // return { success: true, message: "Login successful! Redirecting..." };
}
