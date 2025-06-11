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
} from "@/components/ui/sidebar" // Assuming sidebar components are in this path
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
import { useMockDB } from "@/lib/mock-data-store" // For user info, replace with actual auth context if available
import type { User } from "@/lib/types"
import { signOut as logout } from "@/app/auth/actions" // Corrected import

// Define navigation items based on roles
// In a real app, you'd fetch the current user's role from an auth context
const navItemsByRole = (role?: User["role"]) => {
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
      ],
    },
    {
      groupLabel: "Team Leader",
      roles: ["team-leader"],
      items: [
        { title: "Manage Mailers", href: "/team-leader/mailers", icon: UserPlus, roles: ["team-leader"] },
        { title: "Resource Returns", href: "/team-leader/returns", icon: RotateCcw, roles: ["team-leader"] },
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
        { title: "Example UI", href: "/example-ui-usage", icon: Palette, roles: ["admin", "team-leader", "mailer"] }, // Or all roles for dev
      ],
    },
  ]

  if (!role) return allItems // Show all if no role (e.g. during loading or error)

  return allItems
    .map((group) => {
      // Filter group if group.roles is defined and current role is not included
      if (group.roles && !group.roles.includes(role)) {
        return null
      }
      // Filter items within the group
      const filteredItems = group.items.filter((item) => item.roles.includes(role))
      if (filteredItems.length === 0) {
        return null // Don't show group if no items are visible for this role
      }
      return { ...group, items: filteredItems }
    })
    .filter(Boolean) as typeof allItems // Type assertion after filtering nulls
}

export function AppSidebar() {
  const pathname = usePathname()
  const { state: sidebarState } = useSidebar()

  // TODO: Replace with actual user data from your auth context/hook
  // For now, using a mock user or assuming admin for full visibility
  const [db] = useMockDB()
  const mockCurrentUser = db.users.find((u) => u.role === "admin") || (db.users[0] as User | undefined)
  const currentUserRole = mockCurrentUser?.role

  const getInitials = (name?: string): string => {
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
        {" "}
        {/* Removed p-2, ui/sidebar.tsx now handles padding */}
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout} className="w-full">
              <SidebarMenuButton
                className="w-full"
                tooltip={sidebarState === "collapsed" ? "Logout" : undefined}
                asChild={false} // Important: SidebarMenuButton will be the button
                type="submit" // Make the SidebarMenuButton act as submit
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
