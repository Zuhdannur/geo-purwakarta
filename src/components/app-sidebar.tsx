"use client"

import * as React from "react"
import {
  IconHome,
  IconInnerShadowTop,
  IconLayoutGrid,
  IconMap,
  IconSettings,
  IconUsers,
  IconBuilding,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: IconHome,
    },
    {
      title: "Master Data",
      url: "/dashboard",
      icon: IconLayoutGrid,
      items: [
        { title: "Kelola Pengguna", url: "/dashboard/users", icon: IconUsers },
        { title: "Kelola Peta", url: "/dashboard/maps", icon: IconMap }
      ],
    },
    { title: "Sebaran Rumah Komersil", url: "/dashboard/commercil-houses", icon: IconBuilding },
  ],
  navClouds: [],
  navSecondary: [
   
  ],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()

  // Create user object for NavUser component
  const userData = user ? {
    name: user.name || user.username,
    email: user.email || user.username,
    avatar: "/avatars/default.jpg",
  } : {
    name: "Guest",
    email: "guest@example.com",
    avatar: "/avatars/default.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">SIGPerumPur</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
