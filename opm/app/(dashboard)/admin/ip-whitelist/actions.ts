"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { AllowedIp } from "./page" // Import the interface

export async function addAllowedIp(formData: FormData) {
  const ipAddress = formData.get("ipAddress") as string
  const description = formData.get("description") as string | null
  const adminId = formData.get("adminId") as string // Get adminId from form

  if (!ipAddress || !adminId) {
    return { error: "IP Address and Admin ID are required." }
  }

  // Basic IP format validation (can be improved)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  if (!ipRegex.test(ipAddress.trim())) {
    return { error: "Invalid IP Address format. Please use IPv4 format (e.g., 192.168.1.1)." }
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== adminId) {
    // Verify the action is performed by the logged-in admin
    return { error: "Unauthorized action or session mismatch." }
  }

  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return { error: "You do not have permission to add IPs." }
  }

  const { data: newIpData, error } = await supabase
    .from("allowed_signup_ips")
    .insert({
      ip_address: ipAddress.trim(),
      description: description || null,
      added_by_admin_id: user.id,
    })
    .select("*, profiles (name)") // Select the newly inserted IP with admin name
    .single()

  if (error) {
    console.error("Error adding IP to whitelist:", error)
    if (error.code === "23505") {
      // Unique constraint violation
      return { error: "This IP address is already whitelisted." }
    }
    return { error: "Database error: Could not add IP address." }
  }

  revalidatePath("/admin/ip-whitelist")

  // Construct the AllowedIp object to return to the client for optimistic update
  const newIpForClient: AllowedIp | null = newIpData
    ? {
        id: newIpData.id,
        ip_address: newIpData.ip_address,
        description: newIpData.description,
        created_at: newIpData.created_at,
        added_by_admin_id: newIpData.added_by_admin_id,
        admin_name: newIpData.profiles?.name || "Unknown Admin",
      }
    : null

  return { error: null, success: true, newIp: newIpForClient }
}

export async function deleteAllowedIp(ipId: string) {
  if (!ipId) {
    return { error: "IP ID is required." }
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return { error: "You do not have permission to delete IPs." }
  }

  const { error } = await supabase.from("allowed_signup_ips").delete().eq("id", ipId)

  if (error) {
    console.error("Error deleting IP from whitelist:", error)
    return { error: "Database error: Could not delete IP address." }
  }

  revalidatePath("/admin/ip-whitelist")
  return { error: null, success: true }
}
