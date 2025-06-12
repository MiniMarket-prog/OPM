"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import type { Gender, User as AppUser } from "@/lib/types" // Assuming User is your AppUser type
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { UserRoleSimulator } from "@/components/user-role-simulator"
import {
  UserCircle,
  ImageIcon,
  Building,
  Save,
  CalendarDays,
  Hash,
  Home,
  Phone,
  DollarSign,
  Users2,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { updateMailerProfile } from "./actions"
import type { MailerProfileData } from "./page" // Ensure this type includes actual_salary

interface MailerProfileClientPageProps {
  initialProfile: MailerProfileData
  allUsers: AppUser[]
}

export default function MailerProfileClientPage({ initialProfile, allUsers }: MailerProfileClientPageProps) {
  const [profile, setProfile] = useState<MailerProfileData>(initialProfile)
  const [isPending, startTransition] = useTransition()

  const [nameInput, setNameInput] = useState(profile.name || "")
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile.avatar_url || "")
  const [entryDateInput, setEntryDateInput] = useState(profile.entry_date || "")
  const [ageInput, setAgeInput] = useState<string>(profile.age?.toString() || "")
  const [addressInput, setAddressInput] = useState(profile.address || "")
  const [phoneInput, setPhoneInput] = useState(profile.phone || "")
  // Ensure actual_salary is handled correctly here
  const [actualSalaryInput, setActualSalaryInput] = useState<string>(profile.actual_salary?.toString() || "")
  const [genderInput, setGenderInput] = useState<Gender | "">(profile.gender || "")

  useEffect(() => {
    setProfile(initialProfile)
    setNameInput(initialProfile.name || "")
    setAvatarUrlInput(initialProfile.avatar_url || "")
    setEntryDateInput(initialProfile.entry_date || "")
    setAgeInput(initialProfile.age?.toString() || "")
    setAddressInput(initialProfile.address || "")
    setPhoneInput(initialProfile.phone || "")
    setActualSalaryInput(initialProfile.actual_salary?.toString() || "")
    setGenderInput(initialProfile.gender || "")
  }, [initialProfile])

  const getInitials = (name?: string) => {
    if (!name || name.trim() === "") return "P"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateMailerProfile(formData)
      if (result.error) {
        toast.error("Update Failed", { description: result.error })
      } else if (result.success && result.updatedProfile) {
        toast.success(result.message || "Profile updated successfully!")
        // Ensure the updatedProfile type matches MailerProfileData, including actual_salary
        setProfile(result.updatedProfile as MailerProfileData)
      } else if (result.success) {
        toast.info(result.message || "No changes to save.")
        if (result.updatedProfile) {
          setProfile(result.updatedProfile as MailerProfileData)
        }
      } else {
        toast.error("Update Failed", { description: "An unexpected error occurred." })
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <UserRoleSimulator currentUser={profile as AppUser} allUsers={allUsers} className="mb-6" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle className="h-8 w-8" /> My Profile
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profile.avatar_url || `/placeholder.svg?width=96&height=96&query=${profile.name || "avatar"}`}
                alt={profile.name || "Mailer Avatar"}
              />
              <AvatarFallback className="text-4xl">{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
              <CardDescription>Role: {profile.role}</CardDescription>
              {/* Ensure profile.teams is the correct path after FK hint change */}
              {profile.teams && <CardDescription>Team: {profile.teams.name || "N/A"}</CardDescription>}
              {profile.isp_focus && profile.isp_focus.length > 0 && (
                <CardDescription>ISP Focus: {profile.isp_focus.join(", ")}</CardDescription>
              )}
              {profile.entry_date && <CardDescription>Entry Date: {profile.entry_date}</CardDescription>}
              {profile.age && <CardDescription>Age: {profile.age}</CardDescription>}
              {profile.gender && (
                <CardDescription>
                  Gender: <span className="capitalize">{profile.gender.replace("_", " ")}</span>
                </CardDescription>
              )}
              {profile.phone && <CardDescription>Phone: {profile.phone}</CardDescription>}
              {profile.address && <CardDescription>Address: {profile.address}</CardDescription>}
              {/* Display actual_salary */}
              {profile.actual_salary !== null && profile.actual_salary !== undefined && (
                <CardDescription>Salary: ${Number(profile.actual_salary).toLocaleString()}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" /> Full Name
              </Label>
              <Input
                id="name"
                name="name" // This should match formData.get("name") in actions.ts
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your full name"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="avatarUrl" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" /> Avatar URL
              </Label>
              <Input
                id="avatarUrl"
                name="avatarUrl" // Matches formData.get("avatarUrl")
                type="url"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                placeholder="https://example.com/image.png"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="entryDate" className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> Entry Date
              </Label>
              <Input
                id="entryDate"
                name="entryDate" // Matches formData.get("entryDate")
                type="date"
                value={entryDateInput}
                onChange={(e) => setEntryDateInput(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="age" className="flex items-center gap-1">
                <Hash className="h-4 w-4" /> Age
              </Label>
              <Input
                id="age"
                name="age" // Matches formData.get("age")
                type="number"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="Your age"
                min="0"
                disabled={isPending}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <Home className="h-4 w-4" /> Address
              </Label>
              <Input
                id="address"
                name="address" // Matches formData.get("address")
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Your full address"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> Phone Number
              </Label>
              <Input
                id="phone"
                name="phone" // Matches formData.get("phone")
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Your phone number"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="actualSalary" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Actual Salary
              </Label>
              <Input
                id="actualSalary"
                name="actualSalary" // This MUST match formData.get("actualSalary") in actions.ts
                type="number"
                step="any"
                value={actualSalaryInput}
                onChange={(e) => setActualSalaryInput(e.target.value)}
                placeholder="Your salary"
                min="0"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="gender" className="flex items-center gap-1">
                <Users2 className="h-4 w-4" /> Gender
              </Label>
              <Select
                name="gender" // Matches formData.get("gender")
                value={genderInput}
                onValueChange={(value: Gender | "") => setGenderInput(value)}
                disabled={isPending}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <em>Clear Selection</em>
                  </SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ispFocusDisplay">ISP Focus (Managed by TL)</Label>
              <Input
                id="ispFocusDisplay"
                type="text"
                value={profile.isp_focus?.join(", ") || ""}
                disabled
                readOnly
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your ISP focus is typically assigned by your Team Leader.
              </p>
            </div>
            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" /> {isPending ? "Saving..." : "Update Profile"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
