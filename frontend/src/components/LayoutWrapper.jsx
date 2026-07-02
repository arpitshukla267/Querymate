"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { isAuthenticated } from "@/lib/utils";

const publicRoutes = ["/", "/login", "/signup", "/pricing", "/try-chat", "/try-builder", "/personalize-chatbot"];

export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated() && !isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
