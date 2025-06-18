import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types" // Import UserRole

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  userRole: UserRole // Add userRole prop
}

export function MainNav({ className, userRole, ...props }: MainNavProps) {
  // These links are common to all users and DO NOT include "My Profile"
  const commonLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/mailer/resources", label: "My Resources" },
  ]

  const teamLeaderSpecificLinks = [
    { href: "/team-leader/mailers", label: "My Mailers" },
    { href: "/team-leader/resources", label: "Team Resources" },
    { href: "/team-leader/returns", label: "Returns" },
  ]

  const adminSpecificLinks = [
    { href: "/admin/teams", label: "Teams" },
    { href: "/admin/user-approval", label: "User Approval" },
    { href: "/admin/ip-whitelist", label: "IP Whitelist" },
    { href: "/admin/stats", label: "Stats" },
  ]

  let links = [...commonLinks] // Start with common links

  // Dynamically add "My Profile" based on the user's role
  if (userRole === "mailer") {
    links.push({ href: "/mailer/profile", label: "My Profile" })
  } else if (userRole === "team-leader") {
    links.push({ href: "/team-leader/profile", label: "My Profile" })
    // Add team leader specific links after their profile link
    links = [...links, ...teamLeaderSpecificLinks]
  } else if (userRole === "admin") {
    links.push({ href: "/team-leader/profile", label: "My Profile" }) // Admins use TL profile for now
    // Add both team leader and admin specific links
    links = [...links, ...teamLeaderSpecificLinks, ...adminSpecificLinks]
  }

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:text-primary">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
