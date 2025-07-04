"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const serverStatusSchema = z.enum(["active", "maintenance", "problem", "returned", "pending_return_approval"])

export async function acceptServerReturn(serverId: string) {
  // Await the createSupabaseServerClient call
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== "team-leader") {
    return { error: "Unauthorized: Only Team Leaders can accept returns." }
  }

  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !server) {
    console.error("Error fetching server for return acceptance:", fetchError)
    return { error: "Server not found or access denied." }
  }

  if (server.team_id !== user.user_metadata.team_id) {
    return { error: "Unauthorized: Server does not belong to your team." }
  }

  const { data, error } = await supabase
    .from("servers")
    .update({ status: "returned" })
    .eq("id", serverId)
    .eq("status", "pending_return_approval") // Ensure we only update if it's pending
    .select()
    .single()

  if (error) {
    console.error("Error accepting server return:", error)
    return { error: error.message }
  }

  revalidatePath("/team-leader/returns")
  revalidatePath("/admin/returns") // Assuming an admin returns page exists
  return { success: "Server return accepted successfully.", data }
}

export async function rejectServerReturn(serverId: string) {
  // Await the createSupabaseServerClient call
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== "team-leader") {
    return { error: "Unauthorized: Only Team Leaders can reject returns." }
  }

  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !server) {
    console.error("Error fetching server for return rejection:", fetchError)
    return { error: "Server not found or access denied." }
  }

  if (server.team_id !== user.user_metadata.team_id) {
    return { error: "Unauthorized: Server does not belong to your team." }
  }

  const { data, error } = await supabase
    .from("servers")
    .update({ status: "active" }) // Revert to active
    .eq("id", serverId)
    .eq("status", "pending_return_approval") // Ensure we only update if it's pending
    .select()
    .single()

  if (error) {
    console.error("Error rejecting server return:", error)
    return { error: error.message }
  }

  revalidatePath("/team-leader/returns")
  return { success: "Server return rejected successfully.", data }
}
