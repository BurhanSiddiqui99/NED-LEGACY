"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserAvatarMenu } from "@/components/layouts/user-avatar-menu";
import {
  Menu,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Bike,
  User,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user, role, isConfigured } = useAuth();

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, idx) => {
    const url = "/" + pathSegments.slice(0, idx + 1).join("/");
    const label = segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { label, url, isLast: idx === pathSegments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact brand on phones, where breadcrumbs are hidden */}
        <Link href={`/${role || "login"}/dashboard`} className="sm:hidden flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl lp-brand-gradient flex items-center justify-center shadow-glow">
            <Radio className="w-4 h-4 text-white" />
          </span>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">LogiPulse</span>
        </Link>

        {/* Breadcrumb Navigation */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Link
            href={role ? `/${role}/dashboard` : "/dashboard"}
            className="font-medium hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"
          >
            <Radio className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            LogiPulse
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              {crumb.isLast ? (
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.url}
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Role badge + Notification + Theme toggle + Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Current Role Indicator */}
        {role && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {role === "customer" && <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            {role === "rider" && <Bike className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            {role === "admin" && <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            <span className="capitalize">{role}</span>
          </div>
        )}

        {/* In-App Notifications */}
        <NotificationBell />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Avatar Menu */}
        <UserAvatarMenu />
      </div>
    </header>
  );
}
