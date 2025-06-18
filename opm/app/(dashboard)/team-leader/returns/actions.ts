"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Server, ActionResult } from "@/lib/types" // Import Server and ActionResult

const serverStatusSchema = z.enum(["active", "maintenance", "problem", "returned", "pending_return_approval"])

export async function approveServerReturn(serverId: string): Promise<ActionResult<Server>> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== "team-leader") {
    return { success: false, message: "Unauthorized: Only Team Leaders can accept returns." }
  }

  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !server) {
    console.error("Error fetching server for return acceptance:", fetchError)
    return { success: false, message: "Server not found or access denied." }
  }

  if (server.team_id !== user.user_metadata.team_id) {
    return { success: false, message: "Unauthorized: Server does not belong to your team." }
  }

  const { data, error } = await supabase
    .from("servers")
    .update({ status: "returned" })
    .eq("id", serverId)
    .eq("status", "pending_return_approval")
    .select()
    .single()

  if (error) {
    console.error("Error accepting server return:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/team-leader/returns")
  revalidatePath("/admin/returns")
  return { success: true, message: "Server return accepted successfully.", data: data as Server }
}

export async function rejectServerReturn(serverId: string): Promise<ActionResult<Server>> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== "team-leader") {
    return { success: false, message: "Unauthorized: Only Team Leaders can reject returns." }
  }

  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !server) {
    console.error("Error fetching server for return rejection:", fetchError)
    return { success: false, message: "Server not found or access denied." }
  }

  if (server.team_id !== user.user_metadata.team_id) {
    return { success: false, message: "Unauthorized: Server does not belong to your team." }
  }

  const { data, error } = await supabase
    .from("servers")
    .update({ status: "active" })
    .eq("id", serverId)
    .eq("status", "pending_return_approval")
    .select()
    .single()

  if (error) {
    console.error("Error rejecting server return:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/team-leader/returns")
  return { success: true, message: "Server return rejected successfully.", data: data as Server }
}
