"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Rdp } from "@/lib/types"
import { Pencil, Trash2, Globe, Key, CalendarDays, ServerIcon } from "lucide-react"
import { StatusBadge } from "@/components/mailer/status-badge"

interface RdpCardProps {
  item: Rdp
  onEdit: (item: Rdp) => void
  onDelete: (id: string) => void
}

export function RdpCard({ item, onEdit, onDelete }: RdpCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{item.ip_address}</CardTitle>
        <StatusBadge status={item.status} />
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground flex items-center mb-1">
          <Globe className="mr-2 h-4 w-4" />
          {"IP: "}
          {item.ip_address}
        </p>
        <p className="text-sm text-muted-foreground flex items-center mb-1">
          <ServerIcon className="mr-2 h-4 w-4" />
          {"Username: "}
          {item.username}
        </p>
        <p className="text-sm text-muted-foreground flex items-center mb-1">
          <Key className="mr-2 h-4 w-4" />
          {"Password Alias: "}
          {item.password_alias}
        </p>
        {item.entry_date && (
          <p className="text-sm text-muted-foreground flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            {"Entry Date: "}
            {new Date(item.entry_date).toLocaleDateString()}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
