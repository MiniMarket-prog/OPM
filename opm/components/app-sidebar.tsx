"use client"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShieldCheck,
  UserPlus,
  RotateCcw,
  ServerIcon,
  UserCircle,
  UserCheck,
  Palette,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User, UserRole } from "@/lib/types" // Ensure UserRole is imported
import { signOut as logout } from "@/app/auth/actions"

// Define navigation items based on roles
const navItemsByRole = (roleParam?: string | null) => {
  const allItems = [
    {
      groupLabel: "General",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "team-leader", "mailer"] },
      ],
    },
    {
      groupLabel: "Admin",
      roles: ["admin"],
      items: [
        { title: "Manage Teams", href: "/admin/teams", icon: Users, roles: ["admin"] },
        { title: "Statistics", href: "/admin/stats", icon: BarChart3, roles: ["admin"] },
        { title: "IP Whitelist", href: "/admin/ip-whitelist", icon: ShieldCheck, roles: ["admin"] },
        { title: "User Approval", href: "/admin/user-approval", icon: UserCheck, roles: ["admin"] },
        { title: "Server Returns", href: "/admin/returns", icon: RotateCcw, roles: ["admin"] },
      ],
    },
    {
      groupLabel: "Team Leader",
      roles: ["team-leader"],
      items: [
        { title: "Manage Mailers", href: "/team-leader/mailers", icon: UserPlus, roles: ["team-leader"] },
        { title: "Resource Returns", href: "/team-leader/returns", icon: RotateCcw, roles: ["team-leader"] },
        { title: "My Profile", href: "/team-leader/profile", icon: UserCircle, roles: ["team-leader"] },
      ],
    },
    {
      groupLabel: "Mailer",
      roles: ["mailer"],
      items: [
        { title: "My Resources", href: "/mailer/resources", icon: ServerIcon, roles: ["mailer"] },
        { title: "My Profile", href: "/mailer/profile", icon: UserCircle, roles: ["mailer"] },
      ],
    },
    {
      groupLabel: "Development",
      items: [
        { title: "Example UI", href: "/example-ui-usage", icon: Palette, roles: ["admin", "team-leader", "mailer"] },
      ],
    },
  ]

  if (!roleParam) return [] // If no role (null or undefined), return empty array

  // Define a list of valid UserRole strings
  const validRoles: UserRole[] = ["admin", "team-leader", "mailer", "pending_approval"]

  // Check if roleParam is a valid UserRole string. If not, treat as no role.
  const actualRole: UserRole | undefined = validRoles.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : undefined

  if (!actualRole) return [] // If role is not a valid UserRole string, return empty array

  return allItems
    .map((group) => {
      // Filter group if group.roles is defined and current role is not included
      if (group.roles && !group.roles.includes(actualRole)) {
        return null
      }
      // Filter items within the group
      const filteredItems = group.items.filter((item) => item.roles.includes(actualRole))
      if (filteredItems.length === 0) {
        return null // Don't show group if no items are visible for this role
      }
      return { ...group, items: filteredItems }
    })
    .filter(Boolean) as typeof allItems
}

// Define props for AppSidebar
interface AppSidebarProps {
  currentUser: User
}

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname()
  const { state: sidebarState } = useSidebar()

  // Use the actual current user's role
  const currentUserRole = currentUser?.role

  const getInitials = (name?: string | null): string => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredNavItems = navItemsByRole(currentUserRole)

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-2 flex items-center gap-2 h-[var(--header-height)]">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/abstract-logo.png" alt="App Logo" />
          <AvatarFallback>BE</AvatarFallback>
        </Avatar>
        {sidebarState === "expanded" && <span className="font-semibold text-lg">Bulk Email Org</span>}
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        {filteredNavItems.map((group) => (
          <SidebarGroup key={group.groupLabel}>
            {sidebarState === "expanded" && <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>}
            {sidebarState === "collapsed" && group.items.length > 0 && <SidebarSeparator className="my-2" />}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={sidebarState === "collapsed" ? item.title : undefined}
                    >
                      <a href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout} className="w-full">
              <SidebarMenuButton
                className="w-full"
                tooltip={sidebarState === "collapsed" ? "Logout" : undefined}
                asChild={false}
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
