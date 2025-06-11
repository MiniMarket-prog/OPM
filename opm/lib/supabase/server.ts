import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

// Define the expected shape of the cookie methods that will be passed
interface ServerCookieMethods {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove: (name: string, options: CookieOptions) => void
}

export function createSupabaseServerClient(cookieMethods: ServerCookieMethods) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: cookieMethods.get,
        set: cookieMethods.set,
        remove: cookieMethods.remove,
      },
    },
  )
}
