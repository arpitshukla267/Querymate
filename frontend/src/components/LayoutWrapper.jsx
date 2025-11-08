"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const authRoutes = ["/login", "/signup"];
  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    // Fullscreen auth pages
    return <div className="min-h-screen">{children}</div>;
  }

  // Default layout with Sidebar + Header
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
