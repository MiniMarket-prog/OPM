"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions" // Updated path
import { LogOut } from "lucide-react"

export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await signOut()
      // signOut action redirects, so success toast might not be seen often
      // but error handling within the action is more critical.
      // If signOut action returned an error object:
      // if (result?.error) {
      //   toast.error("Logout Failed", { description: result.error.message });
      // } else {
      //   toast.success("Logged out successfully!");
      // }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isPending} className={className}>
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  )
}
