"use client"

import { useState, useEffect, useActionState } from "react" // Changed useFormState to useActionState
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { updateTeamLeaderProfile } from "./actions"
import type { User, ActionResult } from "@/lib/types"
import { format } from "date-fns"

interface TeamLeaderProfileClientPageProps {
  currentUser: User
  teamMembers: User[]
}

const ispOptions = [
  { value: "Gmail", label: "Gmail" },
  { value: "Outlook", label: "Outlook" },
  { value: "Yahoo", label: "Yahoo" },
  { value: "AOL", label: "AOL" },
  { value: "Other", label: "Other" },
]

export function TeamLeaderProfileClientPage({ currentUser, teamMembers }: TeamLeaderProfileClientPageProps) {
  // Changed useFormState to useActionState
  const [state, formAction] = useActionState<ActionResult, FormData>(updateTeamLeaderProfile, {
    success: false,
    message: "",
  })

  const { toast } = useToast()

  const [selectedIspFocus, setSelectedIspFocus] = useState<string[]>(currentUser.isp_focus || [])
  const [entryDate, setEntryDate] = useState<Date | undefined>(
    currentUser.entry_date ? new Date(currentUser.entry_date) : undefined,
  )

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success!" : "Error!",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
    }
  }, [state])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={currentUser.avatar_url || "/placeholder.svg?height=128&width=128&query=user avatar"}
                  alt={currentUser.name}
                />
                <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <p className="text-sm text-muted-foreground">Role: {currentUser.role}</p>
                {currentUser.teams && <p className="text-sm text-muted-foreground">Team: {currentUser.teams.name}</p>}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" defaultValue={currentUser.full_name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" defaultValue={currentUser.username || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={currentUser.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" defaultValue={currentUser.gender || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry_date">Entry Date</Label>
                <DatePicker
                  name="entry_date"
                  date={entryDate}
                  setDate={(date: Date | undefined) => {
                    setEntryDate(date)
                  }}
                  defaultValue={currentUser.entry_date || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" defaultValue={currentUser.age || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={currentUser.address || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={currentUser.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_salary">Actual Salary</Label>
                <Input
                  id="actual_salary"
                  name="actual_salary"
                  type="number"
                  defaultValue={currentUser.actual_salary || ""}
                />
              </div>
              <div className="space-y-2 col-span-full">
                <Label htmlFor="isp_focus">ISP Focus</Label>
                <MultiSelect
                  options={ispOptions}
                  selected={selectedIspFocus}
                  onSelectChange={setSelectedIspFocus}
                  name="isp_focus"
                />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Team Members</CardTitle>
          <CardDescription>Overview of mailers in your team.</CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No team members found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="p-4 flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.avatar_url || "/placeholder.svg?height=128&width=128&query=user avatar"}
                      alt={member.name}
                    />
                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">Role: {member.role}</p>
                    {member.entry_date && (
                      <p className="text-xs text-muted-foreground">
                        Joined: {format(new Date(member.entry_date), "PPP")}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamLeaderProfileClientPage
