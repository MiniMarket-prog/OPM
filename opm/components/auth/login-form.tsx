"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, LogIn } from "lucide-react" // Added LogIn
import Link from "next/link"
import { login } from "@/app/auth/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card" // Added Card components
import { useEffect } from "react" // Added useEffect
import { toast } from "sonner" // Added sonner

interface LoginFormProps {
  ipStatus?: {
    isAllowed: boolean
    message: string
  }
}

// Define the initial state for useFormState
const initialState = {
  error: null,
  success: false,
  message: null,
}

export function LoginForm({ ipStatus }: LoginFormProps) {
  const [state, formAction] = useFormState(login, initialState)

  useEffect(() => {
    if (state?.error) {
      toast.error("Login Failed", { description: state.error })
    }
    // Success messages are tricky with redirects. If the action redirects,
    // the success toast might not be seen. Usually, the redirect itself is the success indicator.
    // If the action *conditionally* redirects, you might show a toast here.
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

        {/* Display server-side validation errors from useFormState, handled by toast now */}
        {/* {state?.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )} */}

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
