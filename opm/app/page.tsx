import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Bulk Email Operations Manager</h1>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          Organize your servers, seed emails, proxies, RDPs, and teams efficiently.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
