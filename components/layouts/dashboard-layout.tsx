"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, getRoleNavLinks } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAuth } from "@/contexts/auth-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  // Prefetch every page in this role's menu once the dashboard is idle,
  // so the first click on any of them is instant.
  useEffect(() => {
    if (!role) return;
    const prefetchAll = () => getRoleNavLinks(role).forEach((l) => router.prefetch(l.href));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(prefetchAll);
    else setTimeout(prefetchAll, 800);
  }, [role, router]);

  return (
    <div className="flex min-h-screen lp-app-bg font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
        {/* key replays the entrance animation on every navigation */}
        <main
          key={pathname}
          className="flex-1 px-3 py-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto lp-page-enter"
        >
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
