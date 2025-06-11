"use client" // This file is intended for client-side use

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types" // Import generated types

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Optional: Singleton pattern for client components
let client: ReturnType<typeof createSupabaseBrowserClient> | undefined
export function getSupabaseBrowserClient() {
  if (client) {
    return client
  }
  client = createSupabaseBrowserClient()
  return client
}
