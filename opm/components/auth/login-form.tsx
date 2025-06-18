"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, LogIn } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/app/auth/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { ActionResult } from "@/lib/types"

interface LoginFormProps {
  ipStatus?: {
    isAllowed: boolean
    message: string
  }
}

// Define the state for the login action, matching ActionResult
interface LoginState extends ActionResult {
  // No additional properties needed here, as ActionResult covers success, message, error
}

// Define the initial state for useActionState
const initialState: LoginState = {
  error: undefined, // Changed from null to undefined
  success: false,
  message: "", // Changed from null to empty string
}

export function LoginForm({ ipStatus }: LoginFormProps) {
  // Using useActionState from React
  const [state, formAction] = useActionState(signIn, initialState)

  useEffect(() => {
    if (state?.error) {
      toast.error("Login Failed", { description: state.error })
    } else if (state?.success && state.message) {
      // Only show success toast if there's a message and no redirect happens immediately
      // (Redirects usually handle success visually)
      // toast.success("Login Successful", { description: state.message });
    }
  }, [state])

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email and password to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {ipStatus && (
          <Alert
            variant={ipStatus.isAllowed ? "default" : "destructive"}
            className={`mb-4 ${ipStatus.isAllowed ? "border-green-500/50 text-green-700 dark:text-green-400" : ""}`}
          >
            {ipStatus.isAllowed ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle className={ipStatus.isAllowed ? "text-green-700 dark:text-green-500" : ""}>
              {ipStatus.isAllowed ? "IP Status: Recognized" : "IP Status: Verification"}
            </AlertTitle>
            <AlertDescription className={ipStatus.isAllowed ? "text-green-600 dark:text-green-300" : ""}>
              {ipStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-1" />
          </div>
          <LoginButton />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center text-sm">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? "Logging in..." : "Login"}
    </Button>
  )
}
