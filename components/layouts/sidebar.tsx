"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types";
import { getWarehouse } from "@/lib/logistics";
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Bike,
  Users,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Radio,
  Power,
  Navigation2,
  X,
  MessageSquare,
  Warehouse,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  highlight?: boolean;
}

export function getRoleNavLinks(role: UserRole | null): NavLink[] {
  switch (role) {
    case "customer":
      return [
        {
          href: "/customer/dashboard",
          shortLabel: "Home",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/customer/create-order",
          shortLabel: "New",
          label: "Create Courier Request",
          icon: PackagePlus,
          highlight: true,
        },
        {
          href: "/customer/orders",
          shortLabel: "Orders",
          label: "My Orders & Tracking",
          icon: Package,
        },
        {
          href: "/customer/messages",
          shortLabel: "Chats",
          label: "Courier Chats",
          icon: MessageSquare,
        },
        {
          href: "/customer/notifications",
          label: "Notifications",
          icon: Bell,
        },
        {
          href: "/customer/profile",
          label: "Profile & Addresses",
          icon: Settings,
        },
      ];

    case "rider":
      return [
        {
          href: "/rider/dashboard",
          shortLabel: "Home",
          label: "Rider Overview",
          icon: LayoutDashboard,
        },
        {
          href: "/rider/available-orders",
          shortLabel: "Nearby",
          label: "Available Orders (Nearby)",
          icon: Navigation2,
          highlight: true,
        },
        {
          href: "/rider/my-deliveries",
          shortLabel: "Deliveries",
          label: "My Deliveries",
          icon: Package,
        },
        {
          href: "/rider/messages",
          shortLabel: "Chats",
          label: "Customer Chats",
          icon: MessageSquare,
        },
        {
          href: "/rider/notifications",
          label: "Notifications",
          icon: Bell,
        },
        {
          href: "/rider/profile",
          label: "Vehicle & Profile",
          icon: Settings,
        },
      ];

    case "admin":
      return [
        {
          href: "/admin/dashboard",
          shortLabel: "Home",
          label: "Operations Overview",
          icon: LayoutDashboard,
        },
        {
          href: "/admin/orders",
          shortLabel: "Orders",
          label: "All Orders",
          icon: Package,
        },
        {
          href: "/admin/warehouses",
          label: "Warehouses",
          icon: Warehouse,
        },
        {
          href: "/admin/messages",
          label: "Live Chat Dispatch",
          icon: MessageSquare,
        },
        {
          href: "/admin/users",
          label: "Customers",
          icon: Users,
        },
        {
          href: "/admin/riders",
          shortLabel: "Riders",
          label: "Riders & Fleet",
          icon: Bike,
        },
        {
          href: "/admin/analytics",
          shortLabel: "Analytics",
          label: "Analytics & Trends",
          icon: BarChart3,
        },
        {
          href: "/admin/notifications",
          label: "System Alerts",
          icon: Bell,
        },
        {
          href: "/admin/settings",
          label: "System Settings",
          icon: Settings,
        },
      ];

    default:
      return [];
  }
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, riderProfile, riderWarehouseId, updateRiderAvailability } = useAuth();
  const riderCity = getWarehouse(riderWarehouseId)?.city;
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = getRoleNavLinks(role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 dark:border-slate-800/80">
        <Link href={role ? `/${role}/dashboard` : "/login"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl lp-brand-gradient flex items-center justify-center shadow-glow group-hover:scale-105 transition">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                LogiPulse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider lp-brand-text">
                Last-Mile Courier
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Rider Quick Availability Toggle (if Rider) */}
      {role === "rider" && !collapsed && (
        <div className="mx-4 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Rider Status{riderCity ? ` · ${riderCity}` : ""}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                riderProfile?.isAvailable
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  riderProfile?.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}
              />
              {riderProfile?.isAvailable ? "AVAILABLE" : "OFF-DUTY"}
            </span>
          </div>
          <button
            onClick={() => updateRiderAvailability(!riderProfile?.isAvailable)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              riderProfile?.isAvailable
                ? "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {riderProfile?.isAvailable ? "Go Off Duty" : "Go Online & Available"}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {role ? `${role} Portal` : "Menu"}
          </p>
        )}

        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "lp-brand-gradient text-white shadow-glow font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="truncate">{link.label}</span>}
              {/* Primary action gets a small tag instead of looking permanently selected */}
              {link.highlight && !isActive && !collapsed && (
                <span aria-hidden="true" className="ml-auto w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-500/15" />
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop Collapse Trigger */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800/80 text-slate-400 text-xs">
        {!collapsed && <span className="text-[11px] text-slate-400">LogiPulse Platform</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
