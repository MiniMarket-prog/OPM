import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers" // Import cookies directly here
import type { Database } from "@/lib/database.types"

export async function createSupabaseServerClient() {
  // Await the cookies() call to get the actual cookie store object
  const cookieStore = await cookies()

  // console.log("Supabase client created in server.ts"); // Keep this for debugging if needed

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Corrected: Pass arguments as separate parameters
            cookieStore.set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Corrected: Pass arguments as separate parameters for removal
            cookieStore.set(name, "", { ...options, maxAge: 0 }) // Ensure maxAge: 0 for removal
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
