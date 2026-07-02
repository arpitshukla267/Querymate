"use client";
import { SidebarToggle } from "./Sidebar";

export function Header({ onMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 bg-[rgb(var(--color-surface-elevated))] border-b border-[rgb(var(--color-border))] backdrop-blur-lg bg-opacity-90">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center space-x-4">
          <SidebarToggle onToggle={onMenuToggle} />
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold gradient-text">QueryMate</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
