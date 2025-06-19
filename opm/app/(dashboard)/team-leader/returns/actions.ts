"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/actions" // Corrected import path
import type { Database } from "@/lib/database.types"

type Server = Database["public"]["Tables"]["servers"]["Row"]

export async function approveServerReturn(serverId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await getUser()

  if (userError || !userData?.user) {
    console.error("[approveServerReturn] User not authenticated:", userError)
    return { success: false, message: "Authentication required." }
  }

  const userRole = userData.user.user_metadata.role
  const userTeamId = userData.user.user_metadata.team_id

  if (!userRole || userRole !== "team-leader") {
    // Added check for !userRole
    console.error("[approveServerReturn] User is not a team leader or role is missing.")
    return { success: false, message: "Access Denied: Not a Team Leader." }
  }

  console.log(`[approveServerReturn] User ID: ${userData.user.id}, Role: ${userRole}, Team ID: ${userTeamId}`)

  // Fetch the server's current state to perform application-level validation
  const { data: currentServer, error: fetchError } = await supabase
    .from("servers")
    .select("id, status, team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !currentServer) {
    console.error("[approveServerReturn] Error fetching server:", fetchError?.message || "Server not found.")
    return { success: false, message: "Server not found or error fetching details." }
  }

  console.log(
    `[approveServerReturn] Server ID: ${serverId}, Current DB Status (pre-update check): '${currentServer.status}'`,
  )
  console.log(`[approveServerReturn] Server Team ID: ${currentServer.team_id}, User Team ID: ${userTeamId}`)

  if (currentServer.team_id !== userTeamId) {
    console.error("[approveServerReturn] Server does not belong to user's team.")
    return { success: false, message: "Access Denied: Server does not belong to your team." }
  }

  // Application-level status validation
  if (currentServer.status !== "pending_return_approval") {
    console.error(
      `[approveServerReturn] Server ID: ${serverId}, Status was not 'pending_return_approval'. Current status: '${currentServer.status}'`,
    )
    return { success: false, message: `Server status is '${currentServer.status}'. Cannot approve return.` }
  }

  // Perform the update without the status condition in the WHERE clause,
  // as the status check is now done at the application level.
  const { data, error } = await supabase
    .from("servers")
    .update({ status: "returned" })
    .eq("id", serverId)
    .eq("team_id", userTeamId) // Ensure team ownership is still enforced by the query
    .select()

  if (error) {
    console.error("[approveServerReturn] Supabase update error:", error.message)
    return { success: false, message: `Database error: ${error.message}` }
  }

  if (!data || data.length === 0) {
    // If no rows were updated, it means the RLS policy prevented it,
    // or the server ID/team ID didn't match (which should be caught by previous checks).
    // Or, in a very rare race condition, the team_id changed.
    console.error(
      `[approveServerReturn] Update query returned no rows for Server ID: ${serverId}. Possible RLS issue or data mismatch.`,
    )

    // Re-fetch status immediately after failed update for debugging
    const { data: postUpdateServer, error: postUpdateError } = await supabase
      .from("servers")
      .select("status")
      .eq("id", serverId)
      .single()

    if (postUpdateError || !postUpdateServer) {
      console.error(
        "[approveServerReturn] Error re-fetching server status after failed update:",
        postUpdateError?.message || "Server not found.",
      )
      return { success: false, message: "Server status changed or already processed. Please refresh the page." }
    }

    console.error(
      `[approveServerReturn] Server ID: ${serverId}, Actual DB Status (post-failed-update): '${postUpdateServer.status}'`,
    )
    return { success: false, message: "Server status changed or already processed. Please refresh the page." }
  }

  revalidatePath("/team-leader/returns")
  revalidatePath("/team-leader/resources")
  return { success: true, message: "Server return approved successfully." }
}

export async function rejectServerReturn(serverId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await getUser()

  if (userError || !userData?.user) {
    console.error("[rejectServerReturn] User not authenticated:", userError)
    return { success: false, message: "Authentication required." }
  }

  const userRole = userData.user.user_metadata.role
  const userTeamId = userData.user.user_metadata.team_id

  if (!userRole || userRole !== "team-leader") {
    // Added check for !userRole
    console.error("[rejectServerReturn] User is not a team leader or role is missing.")
    return { success: false, message: "Access Denied: Not a Team Leader." }
  }

  console.log(`[rejectServerReturn] User ID: ${userData.user.id}, Role: ${userRole}, Team ID: ${userTeamId}`)

  // Fetch the server's current state to perform application-level validation
  const { data: currentServer, error: fetchError } = await supabase
    .from("servers")
    .select("id, status, team_id")
    .eq("id", serverId)
    .single()

  if (fetchError || !currentServer) {
    console.error("[rejectServerReturn] Error fetching server:", fetchError?.message || "Server not found.")
    return { success: false, message: "Server not found or error fetching details." }
  }

  console.log(
    `[rejectServerReturn] Server ID: ${serverId}, Current DB Status (pre-update check): '${currentServer.status}'`,
  )
  console.log(`[rejectServerReturn] Server Team ID: ${currentServer.team_id}, User Team ID: ${userTeamId}`)

  if (currentServer.team_id !== userTeamId) {
    console.error("[rejectServerReturn] Server does not belong to user's team.")
    return { success: false, message: "Access Denied: Server does not belong to your team." }
  }

  // Application-level status validation
  if (currentServer.status !== "pending_return_approval") {
    console.error(
      `[rejectServerReturn] Server ID: ${serverId}, Status was not 'pending_return_approval'. Current status: '${currentServer.status}'`,
    )
    return { success: false, message: `Server status is '${currentServer.status}'. Cannot reject return.` }
  }

  // Perform the update without the status condition in the WHERE clause,
  // as the status check is now done at the application level.
  const { data, error } = await supabase
    .from("servers")
    .update({ status: "active" }) // Assuming rejecting means setting it back to active
    .eq("id", serverId)
    .eq("team_id", userTeamId) // Ensure team ownership is still enforced by the query
    .select()

  if (error) {
    console.error("[rejectServerReturn] Supabase update error:", error.message)
    return { success: false, message: `Database error: ${error.message}` }
  }

  if (!data || data.length === 0) {
    console.error(
      `[rejectServerReturn] Update query returned no rows for Server ID: ${serverId}. Possible RLS issue or data mismatch.`,
    )

    // Re-fetch status immediately after failed update for debugging
    const { data: postUpdateServer, error: postUpdateError } = await supabase
      .from("servers")
      .select("status")
      .eq("id", serverId)
      .single()

    if (postUpdateError || !postUpdateServer) {
      console.error(
        "[rejectServerReturn] Error re-fetching server status after failed update:",
        postUpdateError?.message || "Server not found.",
      )
      return { success: false, message: "Server status changed or already processed. Please refresh the page." }
    }

    console.error(
      `[rejectServerReturn] Server ID: ${serverId}, Actual DB Status (post-failed-update): '${postUpdateServer.status}'`,
    )
    return { success: false, message: "Server status changed or already processed. Please refresh the page." }
  }

  revalidatePath("/team-leader/returns")
  revalidatePath("/team-leader/resources")
  return { success: true, message: "Server return rejected successfully." }
}
