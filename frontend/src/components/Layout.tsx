"use client";

import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, FileText, List, Users, Settings, LogIn, LogOut, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components

const navItems = [
  { name: "Dashboard", href: "/", icon: Home, requiresAuth: false },
  { name: "Resumes", href: "/resumes", icon: FileText, requiresAuth: true },
  { name: "Playlists", href: "/playlists", icon: List, requiresAuth: true },
  { name: "Pods", href: "/pods", icon: Users, requiresAuth: true },
  { name: "Settings", href: "/settings", icon: Settings, requiresAuth: true },
];

const SidebarNav = ({ className, isAuthenticated, logout, isSidebarOpen }: { className?: string; isAuthenticated: boolean; logout: () => void; isSidebarOpen: boolean }) => (
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
          className={cn(
            "justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground",
            !isSidebarOpen && "justify-center px-0" // Center icon when closed
          )}
        >
          <Link to={item.href} className="flex items-center w-full">
            <item.icon className={cn("h-5 w-5", isSidebarOpen ? "mr-3" : "mr-0")} />
            {isSidebarOpen && item.name}
          </Link>
        </Button>
      );
    })}
    <div className="pt-4">
      {isAuthenticated ? (
        <Button
          variant="ghost"
          className={cn(
            "justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground w-full",
            !isSidebarOpen && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOut className={cn("h-5 w-5", isSidebarOpen ? "mr-3" : "mr-0")} />
          {isSidebarOpen && "Logout"}
        </Button>
      ) : (
        <Button
          asChild
          variant="ghost"
          className={cn(
            "justify-start text-left px-4 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground w-full",
            !isSidebarOpen && "justify-center px-0"
          )}
        >
          <Link to="/auth" className="flex items-center w-full">
            <LogIn className={cn("h-5 w-5", isSidebarOpen ? "mr-3" : "mr-0")} />
            {isSidebarOpen && "Login / Register"}
          </Link>
        </Button>
      )}
    </div>
  </nav>
);

const Layout = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "hidden md:flex flex-col bg-sidebar p-4 shadow-xl rounded-r-lg transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20 items-center"
        )}>
          <div className="mb-6 text-2xl font-bold text-sidebar-primary text-center">
            {isSidebarOpen ? "CareerCircle" : "CC"}
          </div>

          {isAuthenticated && currentUser && (
            <Link to="/settings" className={cn(
              "flex items-center mb-6 p-2 rounded-md hover:bg-sidebar-accent transition-colors",
              isSidebarOpen ? "justify-start" : "justify-center"
            )}>
              {isSidebarOpen ? (
                <div className="flex items-center">
                  <UserIcon className="h-6 w-6 mr-3 text-sidebar-foreground" />
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <UserIcon className="h-6 w-6 text-sidebar-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {currentUser.name}
                  </TooltipContent>
                </Tooltip>
              )}
            </Link>
          )}

          <SidebarNav isAuthenticated={isAuthenticated} logout={logout} isSidebarOpen={isSidebarOpen} />
          <div className="mt-auto pt-4 border-t border-sidebar-border w-full">
            <Button
              variant="ghost"
              className={cn("w-full", isSidebarOpen ? "justify-end pr-2" : "justify-center")}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>
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
                {isAuthenticated && currentUser && (
                  <Link to="/settings" className="flex items-center mb-6 p-2 rounded-md hover:bg-sidebar-accent transition-colors">
                    <UserIcon className="h-6 w-6 mr-3 text-sidebar-foreground" />
                    <div>
                      <p className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </Link>
                )}
                <SidebarNav isAuthenticated={isAuthenticated} logout={logout} isSidebarOpen={true} /> {/* Mobile sidebar always open */}
              </SheetContent>
            </Sheet>
            <div className="text-xl font-bold text-sidebar-primary">CareerCircle</div>
            {isAuthenticated && currentUser && (
              <Link to="/settings" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{currentUser.name.split(' ')[0]}</span>
              </Link>
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