"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/Button";
import { clearAuth, isAuthenticated } from "@/lib/utils";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/personalize-chatbot", label: "Personalize Chatbot", icon: Bot },
  { href: "/chat", label: "AI Support Chat", icon: MessageSquare },
  { href: "/chatbots", label: "My Chatbots", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Help & Docs", icon: HelpCircle },
];

export function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (!isAuthenticated()) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[rgb(var(--color-surface-elevated))]",
          "border-r border-[rgb(var(--color-border))] z-50",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--color-border))]">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QueryMate</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden !p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-[rgb(var(--color-primary))] text-white shadow-lg"
                    : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-text-primary))]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[rgb(var(--color-border))] space-y-2">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            <Palette className="w-5 h-5 mr-3" />
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onToggle }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="lg:hidden !p-2"
    >
      <Menu className="w-6 h-6" />
    </Button>
  );
}
