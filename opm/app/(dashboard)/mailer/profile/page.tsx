"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMockDB } from "@/lib/mock-data-store"
import type { Gender, User, Team } from "@/lib/types"
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

export default function MailerProfilePage() {
  const [db, { getCurrentUser, updateUserProfile }] = useMockDB()

  const firstMailer =
    db.users.find((u: User) => u.role === "mailer") || db.users.find((u: User) => u.id === "user-mailer-test-profile")
  const [selectedUserId, setSelectedUserId] = useState<string>(firstMailer?.id || db.users[0]?.id || "")
  const currentUser = getCurrentUser(selectedUserId)

  // Form state
  const [nameInput, setNameInput] = useState("")
  const [avatarUrlInput, setAvatarUrlInput] = useState("")
  const [ispFocusInput, setIspFocusInput] = useState("") // Display only
  const [entryDateInput, setEntryDateInput] = useState("")
  const [ageInput, setAgeInput] = useState<string>("")
  const [addressInput, setAddressInput] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [actualSalaryInput, setActualSalaryInput] = useState<string>("")
  const [genderInput, setGenderInput] = useState<Gender | "">("")

  useEffect(() => {
    if (currentUser) {
      setNameInput(currentUser.name || "")
      setAvatarUrlInput(currentUser.avatar_url || "")
      setIspFocusInput(currentUser.isp_focus?.join(", ") || "")
      setEntryDateInput(currentUser.entry_date || "")
      setAgeInput(currentUser.age?.toString() || "")
      setAddressInput(currentUser.address || "")
      setPhoneInput(currentUser.phone || "")
      setActualSalaryInput(currentUser.actual_salary?.toString() || "")
      setGenderInput(currentUser.gender || "")
    }
  }, [currentUser])

  if (!currentUser || currentUser.role !== "mailer") {
    return (
      <div className="container mx-auto p-4">
        <UserRoleSimulator
          currentUser={currentUser}
          allUsers={db.users}
          onUserChange={setSelectedUserId}
          className="mb-4"
        />
        <p>Access Denied. You must be a Mailer to view this page.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    const age = ageInput.trim() === "" ? undefined : Number.parseInt(ageInput, 10)
    if (ageInput.trim() !== "" && (isNaN(age!) || age! <= 0)) {
      toast.error("Please enter a valid age.")
      return
    }

    const salary = actualSalaryInput.trim() === "" ? undefined : Number.parseFloat(actualSalaryInput)
    if (actualSalaryInput.trim() !== "" && (isNaN(salary!) || salary! < 0)) {
      toast.error("Please enter a valid salary.")
      return
    }

    const updatedUser = updateUserProfile(currentUser.id, {
      name: nameInput.trim() === "" ? currentUser.name : nameInput.trim(),
      avatar_url: avatarUrlInput.trim() || undefined,
      entry_date: entryDateInput || undefined,
      age: age,
      address: addressInput || undefined,
      phone: phoneInput || undefined,
      actual_salary: salary,
      gender: genderInput === "" ? undefined : genderInput,
    })

    if (updatedUser) {
      toast.success("Profile updated successfully!")
    } else {
      toast.error("Failed to update profile.")
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <UserRoleSimulator
        currentUser={currentUser}
        allUsers={db.users}
        onUserChange={setSelectedUserId}
        className="mb-6"
      />
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
                src={currentUser.avatar_url || `/placeholder.svg?width=96&height=96&query=${currentUser.name}+avatar`}
                alt={currentUser.name}
              />
              <AvatarFallback className="text-4xl">{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{currentUser.name}</CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
              <CardDescription>Role: {currentUser.role}</CardDescription>
              {currentUser.team_id && (
                <CardDescription>
                  Team: {db.teams.find((t: Team) => t.id === currentUser.team_id)?.name || "N/A"}
                </CardDescription>
              )}
              {currentUser.isp_focus && currentUser.isp_focus.length > 0 && (
                <CardDescription>ISP Focus: {currentUser.isp_focus.join(", ")}</CardDescription>
              )}
              {currentUser.entry_date && <CardDescription>Entry Date: {currentUser.entry_date}</CardDescription>}
              {currentUser.age && <CardDescription>Age: {currentUser.age}</CardDescription>}
              {currentUser.gender && (
                <CardDescription>
                  Gender: <span className="capitalize">{currentUser.gender.replace("_", " ")}</span>
                </CardDescription>
              )}
              {currentUser.phone && <CardDescription>Phone: {currentUser.phone}</CardDescription>}
              {currentUser.address && <CardDescription>Address: {currentUser.address}</CardDescription>}
              {currentUser.actual_salary && (
                <CardDescription>Salary: ${currentUser.actual_salary.toLocaleString()}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nameInput" className="flex items-center gap-1">
                  <UserCircle className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="nameInput"
                  type="text"
                  value={nameInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameInput(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="avatarUrl" className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> Avatar URL
                </Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </div>
              <div>
                <Label htmlFor="entryDateInput" className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> Entry Date
                </Label>
                <Input
                  id="entryDateInput"
                  type="date"
                  value={entryDateInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryDateInput(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ageInput" className="flex items-center gap-1">
                  <Hash className="h-4 w-4" /> Age
                </Label>
                <Input
                  id="ageInput"
                  type="number"
                  value={ageInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgeInput(e.target.value)}
                  placeholder="Your age"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="addressInput" className="flex items-center gap-1">
                  <Home className="h-4 w-4" /> Address
                </Label>
                <Input
                  id="addressInput"
                  type="text"
                  value={addressInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressInput(e.target.value)}
                  placeholder="Your full address"
                />
              </div>
              <div>
                <Label htmlFor="phoneInput" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone Number
                </Label>
                <Input
                  id="phoneInput"
                  type="tel"
                  value={phoneInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneInput(e.target.value)}
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <Label htmlFor="actualSalaryInput" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Actual Salary
                </Label>
                <Input
                  id="actualSalaryInput"
                  type="number"
                  step="any"
                  value={actualSalaryInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualSalaryInput(e.target.value)}
                  placeholder="Your salary"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="genderInput" className="flex items-center gap-1">
                  <Users2 className="h-4 w-4" /> Gender
                </Label>
                <Select value={genderInput} onValueChange={(value: Gender) => setGenderInput(value)}>
                  <SelectTrigger id="genderInput">
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
              <div className="md:col-span-2">
                <Label htmlFor="ispFocus">ISP Focus (Managed by TL)</Label>
                <Input id="ispFocus" type="text" value={ispFocusInput} disabled readOnly className="bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">
                  Your ISP focus is typically assigned by your Team Leader.
                </p>
              </div>
            </div>
            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Update Profile
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
