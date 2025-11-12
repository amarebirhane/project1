// components/sidebar.tsx
'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, BarChart3, Settings, User, LogOut } from "lucide-react";
import { useUserStore } from '@/store/userStore'; // Assuming user store for auth

const SidebarItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Features", href: "/features", icon: Settings },
  { title: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUserStore(); // Assuming user store has user and logout

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">FMS</span>
              </div>
              <span className="font-bold text-lg">Financial Management System</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {SidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.title} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t mt-auto">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {user?.name || 'User'}
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}