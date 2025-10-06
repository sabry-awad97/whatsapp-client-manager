"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, group: "Main" },
  { name: "Projects", href: "/projects", icon: FolderOpen, group: "Main" },
  { name: "Documents", href: "/documents", icon: FileText, group: "Main" },
  { name: "Users", href: "/users", icon: Users, group: "Management" },
  { name: "Settings", href: "/settings", icon: Settings, group: "Management" },
];

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "56px" : "208px",
    );
  }, [isCollapsed]);

  const filteredNavigation = navigation.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedNavigation = filteredNavigation.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof navigation>,
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-14" : "w-52",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-11 items-center justify-between border-b px-2.5">
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Home className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-semibold truncate">Template App</h1>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {Object.entries(groupedNavigation).map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <Separator className="my-2" />}
              {!isCollapsed && (
                <div className="px-3 py-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group}
                  </p>
                </div>
              )}
              <div className={cn("space-y-0.5", isCollapsed ? "px-1" : "px-2")}>
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      to={item.href}
                      key={item.name}
                      className={cn(
                        "group flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - User Info */}
        <div className="border-t p-2">
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                AD
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Admin User</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  admin@app.com
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
