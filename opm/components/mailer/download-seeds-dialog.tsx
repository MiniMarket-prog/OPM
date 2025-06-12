"use client"

import { useState } from "react"
import type { SeedEmail } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DownloadSeedsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  allSeedEmails: SeedEmail[]
  currentFilteredSeedEmails: SeedEmail[]
  availableGroupNames: string[]
}

type DownloadType = "current" | "group" | "all"

const generateCsvContent = (seeds: SeedEmail[]): string => {
  if (!seeds.length) return ""
  const headers = ["Email Address", "Password Alias", "Recovery Email", "ISP", "Status", "Group Name", "Entry Date"]
  const rows = seeds.map((seed) =>
    [
      seed.email_address,
      seed.password_alias || "",
      seed.recovery_email || "",
      seed.isp,
      seed.status,
      seed.group_name || "",
      seed.entry_date ? new Date(seed.entry_date).toLocaleDateString() : "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`) // Escape quotes
      .join(","),
  )
  return [headers.join(","), ...rows].join("\n")
}

const triggerCsvDownload = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function DownloadSeedsDialog({
  isOpen,
  onOpenChange,
  allSeedEmails,
  currentFilteredSeedEmails,
  availableGroupNames,
}: DownloadSeedsDialogProps) {
  const [downloadType, setDownloadType] = useState<DownloadType>("current")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const handleGroupToggle = (groupName: string) => {
    setSelectedGroups((prev) => (prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]))
  }

  const handleDownload = () => {
    let seedsToDownload: SeedEmail[] = []
    switch (downloadType) {
      case "current":
        seedsToDownload = currentFilteredSeedEmails
        break
      case "group":
        if (selectedGroups.length > 0) {
          seedsToDownload = allSeedEmails.filter((seed) => seed.group_name && selectedGroups.includes(seed.group_name))
        } else {
          // If "group" is selected but no groups are chosen, download nothing or show a message.
          // For now, download nothing.
        }
        break
      case "all":
        seedsToDownload = allSeedEmails
        break
    }

    if (seedsToDownload.length > 0) {
      const csvContent = generateCsvContent(seedsToDownload)
      triggerCsvDownload(csvContent, "seed_emails.csv")
      onOpenChange(false) // Close dialog after download
    } else {
      // Optionally, show a toast message if no seeds match the criteria
      alert("No seed emails selected for download based on your criteria.")
    }
  }

  const groupSelectionDisabled = downloadType !== "group"

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download Seed Emails</DialogTitle>
          <DialogDescription>Select which seed emails you want to download as a CSV file.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={downloadType} onValueChange={(value: string) => setDownloadType(value as DownloadType)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="current" id="r1" />
              <Label htmlFor="r1">Download current view ({currentFilteredSeedEmails.length} seeds)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group" id="r2" />
              <Label htmlFor="r2">Download by specific group(s)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="r3" />
              <Label htmlFor="r3">Download all seeds ({allSeedEmails.length} seeds)</Label>
            </div>
          </RadioGroup>

          {downloadType === "group" && (
            <div className="mt-4">
              <Label className="mb-2 block">Select groups:</Label>
              <ScrollArea className="h-40 w-full rounded-md border p-4">
                {availableGroupNames.length > 0 ? (
                  availableGroupNames.map((groupName) => (
                    <div key={groupName} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`group-${groupName}`}
                        checked={selectedGroups.includes(groupName)}
                        onCheckedChange={() => handleGroupToggle(groupName)}
                        // disabled={groupSelectionDisabled} // This was causing an error if groupSelectionDisabled was not defined. It's implicitly handled by downloadType === "group"
                      />
                      <Label htmlFor={`group-${groupName}`} className="font-normal">
                        {groupName}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No groups available.</p>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>Download CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
