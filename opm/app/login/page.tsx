import { LoginForm } from "@/components/auth/login-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers as nextHeaders } from "next/headers" // Import nextHeaders

export default async function LoginPage() {
  // Await the createSupabaseServerClient call
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  // Get client IP address
  const h = await nextHeaders()
  const xForwardedFor = h.get("x-forwarded-for")
  const clientIp = xForwardedFor ? xForwardedFor.split(",")[0].trim() : h.get("remote-addr")

  let isIpAllowed = false
  let ipCheckMessage = ""

  if (clientIp) {
    const { data: whitelistedIps, error: ipError } = await supabase.from("allowed_signup_ips").select("ip_address")

    if (ipError) {
      console.error("Error checking IP whitelist on login:", ipError)
      ipCheckMessage = "Could not verify IP status. Please contact support if issues persist."
      isIpAllowed = false // Or treat as neutral if preferred
    } else if (whitelistedIps && whitelistedIps.length > 0) {
      // Whitelist is active (not empty)
      const isIpInList = whitelistedIps.some((ipObj) => ipObj.ip_address === clientIp)
      if (isIpInList) {
        isIpAllowed = true
        ipCheckMessage = `Your IP (${clientIp}) is recognized.`
      } else {
        isIpAllowed = false
        ipCheckMessage = `Your IP (${clientIp}) is not on the approved list. Please contact your administrator if you believe this is an error.`
      }
    } else {
      // Whitelist is empty, so all IPs are effectively allowed (or IP check is not enforced)
      isIpAllowed = true // Or a different status to indicate not enforced
      ipCheckMessage = `IP address verification is not currently restrictive. Your IP: ${clientIp}.`
    }
  } else {
    ipCheckMessage = "Could not determine your IP address for verification."
    isIpAllowed = false // Or treat as neutral
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoginForm ipStatus={{ isAllowed: isIpAllowed, message: ipCheckMessage }} />
    </div>
  )
}
