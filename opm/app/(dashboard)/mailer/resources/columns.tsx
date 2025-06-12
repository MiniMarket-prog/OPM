"use client"

import type React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { CheckedState } from "@radix-ui/react-checkbox"
import type { Server as ServerType, ProxyItem, SeedEmail } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal, Copy } from "lucide-react"
import { StatusBadge } from "@/components/mailer/status-badge"
import { toast } from "sonner"

// --- Reusable Header for Sorting ---
const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => (
  <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
)

// --- Server Columns (no changes) ---
export const getServerColumns = (
  onEdit: (server: ServerType) => void,
  onDelete: (id: string) => void,
): ColumnDef<ServerType>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value: CheckedState) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: CheckedState) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => <SortableHeader column={column}>IP Address</SortableHeader>,
  },
  {
    accessorKey: "provider",
    header: ({ column }) => <SortableHeader column={column}>Provider</SortableHeader>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const server = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(server.id)
                toast.success("Server ID copied to clipboard.")
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(server)}>Edit Server</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(server.id)} className="text-red-600">
              Delete Server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// --- Proxy Columns (no changes) ---
export const getProxyColumns = (
  onEdit: (proxy: ProxyItem) => void,
  onDelete: (id: string) => void,
): ColumnDef<ProxyItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value: CheckedState) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: CheckedState) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "proxy_string",
    header: "Proxy String",
    cell: ({ row }) => <div className="font-mono truncate max-w-xs">{row.original.proxy_string}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const proxy = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(proxy.proxy_string)
                toast.success("Proxy string copied to clipboard.")
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Proxy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(proxy)}>Edit Proxy</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(proxy.id)} className="text-red-600">
              Delete Proxy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// --- Seed Email Columns ---
export const getSeedEmailColumns = (
  onEdit: (seed: SeedEmail) => void,
  onDelete: (id: string) => void,
): ColumnDef<SeedEmail>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value: CheckedState) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: CheckedState) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email_address",
    header: ({ column }) => <SortableHeader column={column}>Email Address</SortableHeader>,
  },
  {
    accessorKey: "isp",
    header: ({ column }) => <SortableHeader column={column}>ISP</SortableHeader>,
  },
  {
    accessorKey: "group_name",
    header: ({ column }) => <SortableHeader column={column}>Group Name</SortableHeader>,
    cell: ({ row }) => row.original.group_name || "-",
  },
  {
    accessorKey: "entry_date",
    header: ({ column }) => <SortableHeader column={column}>Entry Date</SortableHeader>,
    cell: ({ row }) => {
      const date = row.original.entry_date ? new Date(row.original.entry_date) : null
      return date ? date.toLocaleDateString() : "-"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const seed = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                const details = [
                  `Email: ${seed.email_address}`,
                  `Password Alias: ${seed.password_alias || "N/A"}`,
                  `Recovery Email: ${seed.recovery_email || "N/A"}`,
                  `ISP: ${seed.isp}`,
                  `Group Name: ${seed.group_name || "N/A"}`,
                  `Entry Date: ${seed.entry_date ? new Date(seed.entry_date).toLocaleDateString() : "N/A"}`,
                  `Status: ${seed.status}`,
                ].join("\n")
                navigator.clipboard.writeText(details)
                toast.success("Seed details copied to clipboard.")
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(seed)}>Edit Seed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(seed.id)} className="text-red-600">
              Delete Seed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
