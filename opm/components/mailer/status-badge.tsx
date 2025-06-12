import type React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClasses = ""
  const lowerStatus = status.toLowerCase()

  switch (lowerStatus) {
    case "active":
      colorClasses = "bg-green-100 text-green-700 border-green-300"
      break
    case "maintenance":
    case "warmup":
    case "cooldown":
      colorClasses = "bg-yellow-100 text-yellow-700 border-yellow-300"
      break
    case "problem":
    case "banned":
    case "slow":
      colorClasses = "bg-red-100 text-red-700 border-red-300"
      break
    case "returned":
      colorClasses = "bg-gray-100 text-gray-700 border-gray-300"
      break
    default:
      colorClasses = "bg-blue-100 text-blue-700 border-blue-300"
  }
  return (
    <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-xs font-medium", colorClasses)}>
      {status}
    </Badge>
  )
}
