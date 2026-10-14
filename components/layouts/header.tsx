"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserAvatarMenu } from "@/components/layouts/user-avatar-menu";
import {
  Menu,
  Sun,
  Moon,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Bike,
  User,
  Radio,
} from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user, role, isConfigured } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // Theme toggle initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem("logipulse_theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("logipulse_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("logipulse_theme", "dark");
      setIsDark(true);
    }
  };

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Link
            href={`/${role || "dashboard"}`}
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
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm">
            {role === "customer" && <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            {role === "rider" && <Bike className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            {role === "admin" && <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            <span className="capitalize">{role}</span>
          </div>
        )}

        {/* In-App Notifications */}
        <NotificationBell />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
          aria-label="Toggle theme"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 stroke-[2.2]" />
          )}
        </button>

        {/* User Avatar Menu */}
        <UserAvatarMenu />
      </div>
    </header>
  );
}
