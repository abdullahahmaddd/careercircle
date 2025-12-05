"use client";

import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, FileText, List, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Resumes", href: "/resumes", icon: FileText },
  { name: "Playlists", href: "/playlists", icon: List },
  { name: "Pods", href: "/pods", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const SidebarNav = ({ className }: { className?: string }) => (
  <nav className={cn("flex flex-col space-y-1", className)}>
    {navItems.map((item) => (
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
    ))}
  </nav>
);

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4">
          <div className="mb-6 text-2xl font-bold text-sidebar-primary">CareerCircle</div>
          <SidebarNav />
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
                <SidebarNav />
              </SheetContent>
            </Sheet>
            <div className="text-xl font-bold text-sidebar-primary">CareerCircle</div>
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