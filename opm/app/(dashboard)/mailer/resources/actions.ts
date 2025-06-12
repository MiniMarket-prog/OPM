"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { SeedEmail, Server as ServerType, ProxyItem, Rdp, DailyRevenue } from "@/lib/types"
import type { PostgrestError } from "@supabase/supabase-js"
import type { CookieOptions } from "@supabase/ssr"

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options: CookieOptions) => {
      try {
        cookieStore.set(name, value, options)
      } catch (error) {
        // The `set` method was called from a Server Component.
      }
    },
    remove: (name: string, options: CookieOptions) => {
      try {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      } catch (error) {
        // The `delete` method was called from a Server Component.
      }
    },
  })
}

type ActionResult<T = any> = {
  success?: string
  error?: string
  partialErrors?: string[]
  data?: T
  skippedEmails?: Array<{ email: string; reason: string; existing_group_name?: string | null }>
}

// Helper function for date validation (server-side)
const isValidDate = (dateString: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime())

export async function addBulkServers(
  serverEntries: { serverName: string; ips: string[] }[],
  mailerId: string,
  teamId: string,
): Promise<ActionResult<ServerType[]>> {
  const supabase = await getSupabaseClient()
  const partialErrors: string[] = []
  const allNewServers: ServerType[] = []

  for (const entry of serverEntries) {
    if (!entry.serverName || entry.ips.length === 0) {
      partialErrors.push(`Skipped entry with missing server name or IPs: ${entry.serverName || "N/A"}`)
      continue
    }

    const serversToInsert: Array<Omit<ServerType, "id" | "created_at" | "updated_at">> = entry.ips.map((ip) => ({
      provider: entry.serverName,
      ip_address: ip.trim(),
      added_by_mailer_id: mailerId,
      team_id: teamId,
      status: "active",
      user_id: mailerId, // ADDED: user_id
    }))

    if (serversToInsert.length > 0) {
      const { data: newServers, error } = await supabase.from("servers").insert(serversToInsert).select()
      if (error) {
        partialErrors.push(`Error adding IPs for server ${entry.serverName}: ${error.message}`)
      } else if (newServers) {
        allNewServers.push(...newServers)
      }
    }
  }

  if (allNewServers.length === 0 && partialErrors.length > 0) {
    return { error: "All server entries failed to import.", partialErrors }
  }
  revalidatePath("/mailer/resources")
  if (partialErrors.length > 0) {
    return {
      success: `Successfully imported ${allNewServers.length} server IPs with some errors.`,
      partialErrors,
      data: allNewServers,
    }
  }
  return {
    success: `Successfully imported ${allNewServers.length} server IPs for ${serverEntries.length} server(s).`,
    data: allNewServers,
  }
}

export async function addBulkProxies(
  proxyStrings: string,
  mailerId: string,
  teamId: string,
): Promise<ActionResult<ProxyItem[]>> {
  const supabase = await getSupabaseClient()
  if (!proxyStrings) return { error: "Proxy strings are required." }
  const proxyList = proxyStrings.split(/\r?\n/).filter((p) => p.trim() !== "")
  if (proxyList.length === 0) return { error: "No valid proxy strings." }

  const proxiesToInsert: Array<Omit<ProxyItem, "id" | "created_at" | "updated_at">> = proxyList.map((proxy) => ({
    proxy_string: proxy.trim(),
    added_by_mailer_id: mailerId,
    team_id: teamId,
    status: "active" as const,
    user_id: mailerId, // ADDED: user_id
  }))

  const { data: newProxies, error } = await supabase.from("proxies").insert(proxiesToInsert).select()
  if (error) return { error: `Failed to add proxies: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: `${newProxies?.length || 0} proxy/proxies added.`, data: newProxies || [] }
}

export async function addBulkSeedEmails(
  seedEmailsData: Array<{ email: string; password_alias: string; recovery_email?: string }>,
  mailerId: string,
  teamId: string,
  groupName?: string | null,
): Promise<ActionResult<SeedEmail[]>> {
  const supabase = await getSupabaseClient()
  const partialErrors: string[] = []
  const allNewSeedEmails: SeedEmail[] = []
  const skippedEmails: Array<{ email: string; reason: string; existing_group_name?: string | null }> = []
  const emailsToInsert: Array<Omit<SeedEmail, "id" | "created_at" | "updated_at" | "entry_date">> = []

  if (!seedEmailsData || seedEmailsData.length === 0) {
    return { error: "No seed email data provided." }
  }

  const inputEmailAddresses = seedEmailsData.map((se) => se.email.trim().toLowerCase())

  const { data: existingDbEmails, error: fetchError } = await supabase
    .from("seed_emails")
    .select("email_address, group_name")
    .in("email_address", inputEmailAddresses)
    .eq("team_id", teamId)

  if (fetchError) {
    return { error: `Failed to check existing emails: ${fetchError.message}` }
  }

  const existingEmailMap = new Map(existingDbEmails.map((e) => [e.email_address.toLowerCase(), e.group_name]))

  for (const se of seedEmailsData) {
    if (!se.email || !se.password_alias) {
      partialErrors.push(`Skipped due to missing email or password alias: ${se.email || "N/A"}`)
      continue
    }

    const currentEmailLower = se.email.trim().toLowerCase()

    if (existingEmailMap.has(currentEmailLower)) {
      skippedEmails.push({
        email: se.email,
        reason: "Already exists in database for this team.",
        existing_group_name: existingEmailMap.get(currentEmailLower),
      })
      continue
    }

    let isp = "Unknown"
    try {
      const domain = se.email.substring(se.email.lastIndexOf("@") + 1)
      if (domain) {
        isp = domain.split(".")[0]
        isp = isp.charAt(0).toUpperCase() + isp.slice(1)
      }
    } catch (e) {
      /* ignore */
    }

    emailsToInsert.push({
      email_address: se.email.trim(),
      password_alias: se.password_alias.trim(),
      recovery_email: se.recovery_email?.trim() || null,
      isp: isp,
      status: "active",
      added_by_mailer_id: mailerId,
      team_id: teamId,
      group_name: groupName || null,
      user_id: mailerId, // ADDED: user_id
    })
  }

  if (emailsToInsert.length > 0) {
    const result: { data: SeedEmail[] | null; error: PostgrestError | null } = await supabase
      .from("seed_emails")
      .insert(emailsToInsert)
      .select()

    const newlyInsertedEmails: SeedEmail[] | null = result.data
    const dbError: PostgrestError | null = result.error

    if (dbError) {
      partialErrors.push(`Error adding new seed emails: ${dbError.message}`)
      if (newlyInsertedEmails && Array.isArray(newlyInsertedEmails) && newlyInsertedEmails.length > 0) {
        allNewSeedEmails.push(...newlyInsertedEmails)
      }
    } else {
      if (newlyInsertedEmails && Array.isArray(newlyInsertedEmails) && newlyInsertedEmails.length > 0) {
        allNewSeedEmails.push(...newlyInsertedEmails)
      }
    }
  }

  revalidatePath("/mailer/resources")

  let successMessage = ""
  if (allNewSeedEmails.length > 0) {
    successMessage = `Successfully imported ${allNewSeedEmails.length} new seed emails.`
  }

  if (skippedEmails.length > 0 && allNewSeedEmails.length === 0 && partialErrors.length === 0) {
    return {
      error: `All ${skippedEmails.length} provided emails already exist or were invalid. No new emails added.`,
      skippedEmails,
      partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
    }
  }

  if (
    allNewSeedEmails.length === 0 &&
    partialErrors.length > 0 &&
    emailsToInsert.length === 0 &&
    skippedEmails.length === 0
  ) {
    return { error: "All seed email entries were invalid or failed to import.", partialErrors }
  }

  return {
    success:
      successMessage ||
      (skippedEmails.length > 0 || partialErrors.length > 0 ? "Import process completed." : "No new emails to import."),
    data: allNewSeedEmails.length > 0 ? allNewSeedEmails : undefined,
    partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
    skippedEmails: skippedEmails.length > 0 ? skippedEmails : undefined,
  }
}

export async function addRdp(
  ipAddress: string,
  username: string,
  passwordAlias: string,
  entryDate: string,
  mailerId: string,
  teamId: string,
): Promise<ActionResult<Rdp>> {
  const supabase = await getSupabaseClient()
  if (!ipAddress || !username || !passwordAlias || !entryDate)
    return { error: "IP Address, Username, Password Alias, and Entry Date are required." }

  // Server-side validation for single RDP add
  if (!isValidDate(entryDate)) {
    return { error: `Invalid Entry Date format: "${entryDate}". Expected YYYY-MM-DD.` }
  }

  const { data: newRdp, error } = await supabase
    .from("rdps")
    .insert({
      ip_address: ipAddress,
      username: username,
      password_alias: passwordAlias,
      entry_date: entryDate,
      added_by_mailer_id: mailerId,
      team_id: teamId,
      status: "active" as const,
      user_id: mailerId,
    })
    .select()
    .single()

  if (error) return { error: `Failed to add RDP: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "RDP added successfully.", data: newRdp || undefined }
}

export async function addBulkRdps(
  rdpsData: Array<Pick<Rdp, "ip_address" | "username" | "password_alias" | "entry_date">>,
  mailerId: string,
  teamId: string,
): Promise<ActionResult<Rdp[]>> {
  const supabase = await getSupabaseClient()
  const partialErrors: string[] = []
  const allNewRdps: Rdp[] = []
  const rdpsToInsert: Array<Omit<Rdp, "id" | "created_at" | "updated_at" | "status">> = []

  if (!rdpsData || rdpsData.length === 0) {
    return { error: "No RDP data provided." }
  }

  for (const rdp of rdpsData) {
    if (!rdp.ip_address || !rdp.username || !rdp.password_alias || !rdp.entry_date) {
      partialErrors.push(
        `Skipped due to missing required fields: IP: ${rdp.ip_address || "N/A"}, User: ${rdp.username || "N/A"}`,
      )
      continue
    }

    // Server-side validation for entry_date
    if (!isValidDate(rdp.entry_date)) {
      partialErrors.push(
        `Skipped RDP with invalid entry date format: ${rdp.ip_address} - "${rdp.entry_date}". Expected YYYY-MM-DD.`,
      )
      continue
    }

    rdpsToInsert.push({
      ip_address: rdp.ip_address.trim(),
      username: rdp.username.trim(),
      password_alias: rdp.password_alias.trim(),
      entry_date: rdp.entry_date.trim(),
      added_by_mailer_id: mailerId,
      team_id: teamId,
      user_id: mailerId,
    })
  }

  if (rdpsToInsert.length > 0) {
    const { data: newRdps, error: dbError } = await supabase
      .from("rdps")
      .insert(rdpsToInsert.map((r) => ({ ...r, status: "active" }))) // Explicitly add status
      .select()

    if (dbError) {
      partialErrors.push(`Error adding new RDPs: ${dbError.message}`)
    }

    // Ensure newRdps is an array before pushing
    if (newRdps && Array.isArray(newRdps)) {
      allNewRdps.push(...newRdps)
    }
  }

  revalidatePath("/mailer/resources")

  if (allNewRdps.length === 0 && partialErrors.length > 0) {
    return { error: "All RDP entries failed to import.", partialErrors }
  }

  if (partialErrors.length > 0) {
    return {
      success: `Successfully imported ${allNewRdps.length} RDPs with some errors.`,
      partialErrors,
      data: allNewRdps,
    }
  }

  return {
    success: `Successfully imported ${allNewRdps.length} RDPs.`,
    data: allNewRdps,
  }
}

export async function addDailyRevenue(
  date: string,
  amount: number,
  mailerId: string,
  teamId: string,
): Promise<ActionResult<DailyRevenue>> {
  const supabase = await getSupabaseClient()
  if (!date || isNaN(amount) || amount < 0) {
    return { error: "A valid date and a positive amount are required." }
  }
  const { data, error } = await supabase
    .from("daily_revenue")
    .upsert({ mailer_id: mailerId, date: date, team_id: teamId, amount: amount }, { onConflict: "mailer_id, date" })
    .select()
    .single()

  if (error) return { error: `Failed to log revenue: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: `Revenue for ${date} logged successfully.`, data: data || undefined }
}

export async function updateServer(
  id: string,
  updateData: Partial<Pick<ServerType, "provider" | "ip_address" | "status">>,
): Promise<ActionResult<ServerType>> {
  const supabase = await getSupabaseClient()
  const { data: updatedServer, error } = await supabase
    .from("servers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: `Failed to update server: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "Server updated successfully.", data: updatedServer }
}

export async function updateProxy(
  id: string,
  updateData: Partial<Pick<ProxyItem, "proxy_string" | "status">>,
): Promise<ActionResult<ProxyItem>> {
  const supabase = await getSupabaseClient()
  const { data: updatedProxy, error } = await supabase.from("proxies").update(updateData).eq("id", id).select().single()
  if (error) return { error: `Failed to update proxy: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "Proxy updated successfully.", data: updatedProxy }
}

export async function updateSeedEmail(
  id: string,
  updateData: Partial<
    Pick<SeedEmail, "email_address" | "password_alias" | "recovery_email" | "isp" | "status" | "group_name">
  >,
): Promise<ActionResult<SeedEmail>> {
  const supabase = await getSupabaseClient()

  const processedUpdateData: { [key: string]: any } = { ...updateData }
  if (processedUpdateData.recovery_email === "") {
    processedUpdateData.recovery_email = null
  }
  if (processedUpdateData.group_name === "") {
    processedUpdateData.group_name = null
  }

  const { data: updatedSeedEmail, error } = await supabase
    .from("seed_emails")
    .update(processedUpdateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating seed email in action:", error.message)
    return { error: `Failed to update seed email: ${error.message}` }
  }
  revalidatePath("/mailer/resources")
  return { success: "Seed email updated successfully.", data: updatedSeedEmail as SeedEmail }
}

export async function updateRdp(
  id: string,
  updateData: Partial<Pick<Rdp, "ip_address" | "username" | "password_alias" | "entry_date" | "status">>,
): Promise<ActionResult<Rdp>> {
  const supabase = await getSupabaseClient()

  // Server-side validation for single RDP update
  if (updateData.entry_date && !isValidDate(updateData.entry_date)) {
    return { error: `Invalid Entry Date format: "${updateData.entry_date}". Expected YYYY-MM-DD.` }
  }

  const { data: updatedRdp, error } = await supabase.from("rdps").update(updateData).eq("id", id).select().single()
  if (error) return { error: `Failed to update RDP: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "RDP updated successfully.", data: updatedRdp }
}

export async function deleteServer(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.from("servers").delete().eq("id", id)
  if (error) return { error: `Failed to delete server: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "Server deleted successfully." }
}

export async function deleteProxy(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.from("proxies").delete().eq("id", id)
  if (error) return { error: `Failed to delete proxy: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "Proxy deleted successfully." }
}

export async function deleteSeedEmail(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.from("seed_emails").delete().eq("id", id)
  if (error) return { error: `Failed to delete seed email: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "Seed email deleted successfully." }
}

export async function deleteRdp(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.from("rdps").delete().eq("id", id)
  if (error) return { error: `Failed to delete RDP: ${error.message}` }
  revalidatePath("/mailer/resources")
  return { success: "RDP deleted successfully." }
}
