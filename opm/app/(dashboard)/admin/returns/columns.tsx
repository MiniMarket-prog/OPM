"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Server } from "@/lib/types"
import { Badge } from "@/components/ui/badge" // Assuming you have a Badge component

// Define a type for the row data, including the joined profile
export type ReturnedServerRow = Server & {
  profiles: { full_name: string | null; name: string | null; username: string | null } | null // CRITICAL CHANGE: Add name and username to profiles type
}

export const columns: ColumnDef<ReturnedServerRow>[] = [
  {
    accessorKey: "ip_address",
    header: "IP Address",
  },
  {
    accessorKey: "profiles",
    header: "Added By Mailer",
    cell: ({ row }) => {
      // CRITICAL CHANGE: Fallback to name or username if full_name is null
      const mailerName =
        row.original.profiles?.full_name ||
        row.original.profiles?.name ||
        row.original.profiles?.username ||
        "Unknown Mailer"
      return <div>{mailerName}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      // CRITICAL CHANGE: Ensure variant type matches Badge component's expected type
      let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "default"
      switch (status) {
        case "returned":
          variant = "success"
          break
        case "pending_return_approval":
          variant = "warning"
          break
        case "active":
          variant = "default"
          break
        case "problem":
          variant = "destructive"
          break
        case "maintenance":
          variant = "secondary"
          break
        default:
          variant = "outline"
      }
      return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>
    },
  },
  {
    accessorKey: "updated_at", // Assuming this is the timestamp of the status change
    header: "Last Updated",
    cell: ({ row }) => {
      const date = row.original.updated_at
      if (!date) return "N/A"
      return new Date(date).toLocaleDateString()
    },
  },
  // You can add more columns here if needed, e.g., original entry date, server group, etc.
]
