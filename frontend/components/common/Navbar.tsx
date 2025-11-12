// components/common/navbar.tsx
'use client';
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Menu, User, LogOut, Search, Bell, Plus } from "lucide-react";
import { useUserStore } from '@/store/userStore'; // Assuming you have a user store for auth

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useUserStore(); // Assuming user store has user and logout
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Handle search submission (e.g., redirect to search results)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search page or perform search logic
      console.log('Searching for:', searchQuery); // Replace with actual search logic
      setSearchOpen(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-background/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="mr-4 hidden sm:flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">FMS</span>
          </div>
          <span className="font-bold">Financial Management System</span>
        </Link>

        {/* Mobile menu button */}
        <Button variant="ghost" size="sm" className="mr-2 px-0 lg:hidden">
          <Menu className="h-6 w-6" onClick={() => setIsOpen(!isOpen)} />
        </Button>

        {/* Search - Desktop */}
        <div className="hidden lg:flex mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 rounded-full bg-background"
              />
            </div>
            <Button type="submit" variant="ghost" size="sm" className="ml-2">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* User Actions - Notification, Create, User Menu */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Notification Button */}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Create Button */}
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>

          {/* User Menu */}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            {user?.name || 'Profile'}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <div className="fixed right-0 top-0 h-full w-64 bg-background border-l shadow-lg">
            <div className="p-4">
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full justify-start">
                Close
              </Button>
              <nav className="mt-4 space-y-2">
                {/* Add mobile search here if needed */}
                <form onSubmit={handleSearch} className="space-y-2">
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Button type="submit" className="w-full">
                    Search
                  </Button>
                </form>
                {/* Mobile actions */}
                <div className="mt-4 space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="default" size="sm" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </nav>
              <div className="mt-6 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}