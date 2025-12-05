"use client";

import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, FileText, List, Users, Settings, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const navItems = [
  { name: "Dashboard", href: "/", icon: Home, requiresAuth: false },
  { name: "Resumes", href: "/resumes", icon: FileText, requiresAuth: true },
  { name: "Playlists", href: "/playlists", icon: List, requiresAuth: true },
  { name: "Pods", href: "/pods", icon: Users, requiresAuth: true },
  { name: "Settings", href: "/settings", icon: Settings, requiresAuth: true },
];

const SidebarNav = ({ className, isAuthenticated, logout }: { className?: string; isAuthenticated: boolean; logout: () => void }) => (
  <nav className={cn("flex flex-col space-y-1", className)}>
    {navItems.map((item) => {
      if (item.requiresAuth && !isAuthenticated) {
        return null; // Don't show if requires auth and not authenticated
      }
      return (
        <Button
          key={item.name}
          asChild
          variant="ghost"
          className="justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Link to={item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        </Button>
      );
    })}
    <div className="pt-4">
      {isAuthenticated ? (
        <Button
          variant="ghost"
          className="justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground w-full"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      ) : (
        <Button
          asChild
          variant="ghost"
          className="justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground w-full"
        >
          <Link to="/auth">
            <LogIn className="mr-3 h-5 w-5" />
            Login / Register
          </Link>
        </Button>
      )}
    </div>
  </nav>
);

const Layout = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated, currentUser, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden md:flex w-64 flex-col bg-sidebar p-4 shadow-xl rounded-r-lg">
          <div className="mb-6 text-2xl font-bold text-sidebar-primary">CareerCircle</div>
          <SidebarNav isAuthenticated={isAuthenticated} logout={logout} />
        </aside>
      )}

      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <header className="flex items-center justify-between border-b bg-sidebar p-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="mb-6 text-2xl font-bold text-sidebar-primary">CareerCircle</div>
                <SidebarNav isAuthenticated={isAuthenticated} logout={logout} />
              </SheetContent>
            </Sheet>
            <div className="text-xl font-bold text-sidebar-primary">CareerCircle</div>
            {isAuthenticated && currentUser && (
              <div className="flex items-center gap-2 text-sidebar-foreground">
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{currentUser.name.split(' ')[0]}</span>
              </div>
            )}
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;