"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

// Simplified nav items for a horizontal header
const navItemsByRole = (role?: User["role"]) => {
  const items = [
    { title: "Dashboard", href: "/dashboard", roles: ["admin", "team-leader", "mailer"] },
    { title: "Teams", href: "/admin/teams", roles: ["admin"] },
    { title: "Stats", href: "/admin/stats", roles: ["admin"] },
    { title: "IP Whitelist", href: "/admin/ip-whitelist", roles: ["admin"] },
    { title: "Mailers", href: "/team-leader/mailers", roles: ["team-leader"] },
    { title: "Returns", href: "/team-leader/returns", roles: ["team-leader"] },
    { title: "Resources", href: "/mailer/resources", roles: ["mailer"] },
  ]

  if (!role) return []
  return items.filter((item) => item.roles.includes(role))
}

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  userRole: User["role"]
}

export function MainNav({ className, userRole, ...props }: MainNavProps) {
  const pathname = usePathname()
  const items = navItemsByRole(userRole)

  return (
    <nav className={cn("hidden md:flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
