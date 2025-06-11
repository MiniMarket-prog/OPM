"use client"

import type React from "react"
import { useState, useTransition } from "react"
import type { AllowedIp } from "./page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Shield, Building } from "lucide-react"
import Link from "next/link"
import { addAllowedIp, deleteAllowedIp } from "./actions"
import { toast } from "sonner"

interface IpWhitelistClientPageProps {
  initialAllowedIps: AllowedIp[]
  currentAdminId: string
}

export function IpWhitelistClientPage({ initialAllowedIps, currentAdminId }: IpWhitelistClientPageProps) {
  const [allowedIps, setAllowedIps] = useState<AllowedIp[]>(initialAllowedIps)
  const [newIpAddress, setNewIpAddress] = useState("")
  const [newIpDescription, setNewIpDescription] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleAddIp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newIpAddress.trim()) {
      toast.error("IP Address cannot be empty.")
      return
    }

    // Basic IP format validation (can be improved)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(newIpAddress.trim())) {
      toast.error("Invalid IP Address format. Please use IPv4 format (e.g., 192.168.1.1).")
      return
    }

    const formData = new FormData()
    formData.append("ipAddress", newIpAddress.trim())
    formData.append("description", newIpDescription.trim())
    formData.append("adminId", currentAdminId)

    startTransition(async () => {
      const result = await addAllowedIp(formData)
      if (result?.error) {
        toast.error("Failed to add IP", { description: result.error })
      } else if (result?.success && result.newIp) {
        toast.success("IP address added to whitelist!")
        setAllowedIps((prev) => [result.newIp!, ...prev])
        setNewIpAddress("")
        setNewIpDescription("")
      } else {
        toast.error("Failed to add IP", { description: "An unexpected error occurred." })
      }
    })
  }

  const handleDeleteIp = async (ipId: string) => {
    if (!confirm("Are you sure you want to remove this IP from the whitelist?")) {
      return
    }
    startTransition(async () => {
      const result = await deleteAllowedIp(ipId)
      if (result?.error) {
        toast.error("Failed to delete IP", { description: result.error })
      } else if (result?.success) {
        toast.success("IP address removed from whitelist!")
        setAllowedIps((prev) => prev.filter((ip) => ip.id !== ipId))
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" /> Manage Sign-up IP Whitelist
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <Building className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-green-500" /> Add IP to Whitelist
          </CardTitle>
          <CardDescription>
            Only users attempting to sign up from these IP addresses will be allowed. If the list is empty, all IPs are
            allowed (less secure).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddIp} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newIpAddress">IP Address (IPv4)</Label>
                <Input
                  id="newIpAddress"
                  name="newIpAddress"
                  type="text"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  disabled={isPending}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newIpDescription">Description (Optional)</Label>
                <Input
                  id="newIpDescription"
                  name="newIpDescription"
                  type="text"
                  value={newIpDescription}
                  onChange={(e) => setNewIpDescription(e.target.value)}
                  placeholder="e.g., Office Network, Specific User"
                  disabled={isPending}
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding IP..." : "Add IP to Whitelist"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Note: IP whitelisting can be bypassed by VPNs/proxies and might affect users with dynamic IPs. Use this
            feature judiciously as part of a broader security strategy.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currently Whitelisted IPs</CardTitle>
          <CardDescription>
            {allowedIps.length === 0
              ? "No IPs are currently whitelisted. All IPs are allowed to attempt sign-up."
              : `Found ${allowedIps.length} whitelisted IP(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allowedIps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowedIps.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium">{ip.ip_address}</TableCell>
                    <TableCell>{ip.description || "N/A"}</TableCell>
                    <TableCell>{ip.admin_name || "N/A"}</TableCell>
                    <TableCell>{new Date(ip.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteIp(ip.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>The IP whitelist is currently empty. This means sign-ups are not restricted by IP address.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default IpWhitelistClientPage
