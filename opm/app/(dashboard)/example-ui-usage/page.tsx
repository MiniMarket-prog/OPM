"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useState } from "react"

export default function ExampleUiPage() {
  const [inputValue, setInputValue] = useState("")
  const [selectValue, setSelectValue] = useState("")

  const handleShowToast = () => {
    toast("Hello from Sonner!", { description: "This is a sonner toast notification.", duration: 3000 })
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Shadcn/UI Component Demo</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <Avatar>
              <AvatarImage src="/diverse-user-avatars.png" alt="User Avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Sample Card</CardTitle>
              <CardDescription>Demonstrating various UI elements.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="framework">Favorite Framework</Label>
            <Select onValueChange={setSelectValue} value={selectValue}>
              <SelectTrigger id="framework">
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="sveltekit">SvelteKit</SelectItem>
                <SelectItem value="nuxt">Nuxt.js</SelectItem>
                <SelectItem value="remix">Remix</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Input Value: <span className="font-semibold">{inputValue || "N/A"}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Selected Framework: <span className="font-semibold">{selectValue || "N/A"}</span>
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button onClick={handleShowToast}>Show Toast</Button>
          <Button variant="outline">Secondary Action</Button>
        </CardFooter>
      </Card>
      <div className="mt-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Note on Charts:</h2>
        <p className="text-muted-foreground">
          For charts (from <code className="font-mono bg-muted px-1 py-0.5 rounded">@/components/ui/chart</code>), you
          typically use components like <code className="font-mono bg-muted px-1 py-0.5 rounded">ChartContainer</code>{" "}
          along with <code className="font-mono bg-muted px-1 py-0.5 rounded">recharts</code> library components (e.g.,{" "}
          <code className="font-mono bg-muted px-1 py-0.5 rounded">BarChart</code>,{" "}
          <code className="font-mono bg-muted px-1 py-0.5 rounded">LineChart</code>). The chart components from
          shadcn/ui provide wrappers and styling utilities for recharts.
        </p>
        <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-x-auto">
          {`import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// ... then use within your component`}
        </pre>
      </div>
    </div>
  )
}
