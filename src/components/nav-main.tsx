"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: Icon
  items?: { title: string; url: string; icon?: Icon }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url
            const hasChildren = Array.isArray(item.items) && item.items.length > 0

            return (
              <SidebarMenuItem key={item.title}>
                {hasChildren ? (
                  <SidebarMenuButton tooltip={item.title} isActive={isActive} aria-disabled>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}

                {hasChildren && (
                  <SidebarMenuSub>
                    {item.items!.map((sub) => {
                      const subActive = pathname === sub.url
                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={subActive}>
                            <Link href={sub.url}>
                              {sub.icon && <sub.icon />}
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
