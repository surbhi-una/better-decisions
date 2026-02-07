import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import {
  LayoutDashboard,
  Network,
  Settings2,
  Cpu,
  Search,
  Bell,
  Menu,
  X,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Target,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatAssistant } from "@/components/ChatAssistant";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const [projectsOpen, setProjectsOpen] = React.useState(true);

  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const activeProjects = allProjects.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));

  const navItems = [
    { href: "/decisions", label: "Decisions", icon: Target },
    { href: "/meetings/new", label: "Submit Meeting", icon: MessageSquare },
    { href: "/dashboard", label: "Analytics", icon: LayoutDashboard },
    { href: "/mcp", label: "MCP Configuration", icon: Cpu },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Better-Decisions</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Enterprise Edition
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {/* Projects Section with Children */}
        <div>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              location === "/" || location.startsWith("/stream")
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4" />
              Projects
            </div>
            {projectsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {projectsOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
              <Link href="/">
                <a
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    location === "/"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-sidebar-foreground"
                  }`}
                >
                  All Projects
                </a>
              </Link>
              {activeProjects.map((project) => {
                const isActive = location === `/stream?project=${project.id}`;
                return (
                  <Link key={project.id} href={`/stream?project=${project.id}`}>
                    <a
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-sidebar-foreground"
                      }`}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Nav Items */}
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                location === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Alex Chen</p>
            <p className="text-xs text-muted-foreground truncate">Engineering Mgr</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <SidebarContent />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 lg:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Better-Decisions</span>
          </div>

          <div className="hidden lg:flex items-center w-full max-w-md gap-2 text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-transparent focus-within:border-primary/20 focus-within:bg-secondary transition-colors">
            <Search className="w-4 h-4" />
            <Input 
              placeholder="Search meetings, decisions, or code contexts..." 
              className="border-0 bg-transparent h-auto p-0 placeholder:text-muted-foreground/70 focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
        
        <ChatAssistant />
      </div>
    </div>
  );
}
