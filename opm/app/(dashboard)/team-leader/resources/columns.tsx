import type { ColumnDef } from "@tanstack/react-table"
import type { Server, ProxyItem, SeedEmail, Rdp, User, Gender } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Helper to get initials for avatar fallback
const getInitials = (name?: string) => {
  if (!name || name.trim() === "") return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export const getTLServerColumns = (): ColumnDef<Server>[] => [
  {
    accessorKey: "ip_address",
    header: "IP Address",
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Server["status"]
      return (
        <Badge variant={status === "active" ? "default" : "outline"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Added On",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString()
    },
  },
]

export const getTLProxyColumns = (): ColumnDef<ProxyItem>[] => [
  {
    accessorKey: "proxy_string",
    header: "Proxy String",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ProxyItem["status"]
      return (
        <Badge variant={status === "active" ? "default" : "outline"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Added On",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString()
    },
  },
]

export const getTLSeedEmailColumns = (): ColumnDef<SeedEmail>[] => [
  {
    accessorKey: "email_address",
    header: "Email Address",
  },
  {
    accessorKey: "isp",
    header: "ISP",
  },
  {
    accessorKey: "group_name",
    header: "Group Name",
    cell: ({ row }) => row.getValue("group_name") || "N/A",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as SeedEmail["status"]
      return (
        <Badge variant={status === "active" ? "default" : "outline"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "entry_date",
    header: "Entry Date",
    cell: ({ row }) => {
      const date = row.getValue("entry_date") as string | null
      return date ? new Date(date).toLocaleDateString() : "N/A"
    },
  },
]

export const getTLRdpColumns = (): ColumnDef<Rdp>[] => [
  {
    accessorKey: "connection_info",
    header: "Connection Info",
  },
  {
    accessorKey: "password_alias",
    header: "Password Alias",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Rdp["status"]
      return (
        <Badge variant={status === "active" ? "default" : "outline"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Added On",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString()
    },
  },
]

export const getTLMailerColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={
              row.original.avatar_url || `/placeholder.svg?width=32&height=32&query=${row.original.name || "avatar"}`
            }
            alt={row.original.name || "Mailer Avatar"}
          />
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <span>{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => row.getValue("username") || "N/A",
  },
  {
    accessorKey: "isp_focus",
    header: "ISP Focus",
    cell: ({ row }) => {
      const ispFocus = row.getValue("isp_focus") as string[] | null | undefined
      return ispFocus && ispFocus.length > 0 ? ispFocus.join(", ") : "N/A"
    },
  },
  {
    accessorKey: "entry_date",
    header: "Entry Date",
    cell: ({ row }) => {
      const date = row.getValue("entry_date") as string | null
      return date ? new Date(date).toLocaleDateString() : "N/A"
    },
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => row.getValue("age") || "N/A",
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as Gender | null
      return gender ? gender.replace(/_/g, " ") : "N/A"
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "N/A",
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => row.getValue("address") || "N/A",
  },
  {
    accessorKey: "actual_salary",
    header: "Salary",
    cell: ({ row }) => {
      const salary = row.getValue("actual_salary") as number | null
      return salary !== null && salary !== undefined ? `$${salary.toLocaleString()}` : "N/A"
    },
  },
]
