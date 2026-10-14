"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types";
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
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, riderProfile, updateRiderAvailability } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const getNavLinks = () => {
    switch (role) {
      case "customer":
        return [
          {
            href: "/customer/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            href: "/customer/create-order",
            label: "Create Courier Request",
            icon: PackagePlus,
            highlight: true,
          },
          {
            href: "/customer/orders",
            label: "My Orders & Tracking",
            icon: Package,
          },
          {
            href: "/customer/messages",
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
            label: "Rider Overview",
            icon: LayoutDashboard,
          },
          {
            href: "/rider/available-orders",
            label: "Available Orders (Nearby)",
            icon: Navigation2,
            highlight: true,
          },
          {
            href: "/rider/my-deliveries",
            label: "My Deliveries",
            icon: Package,
          },
          {
            href: "/rider/messages",
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
            label: "Operations Overview",
            icon: LayoutDashboard,
          },
          {
            href: "/admin/orders",
            label: "All Orders",
            icon: Package,
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
            label: "Riders & Fleet",
            icon: Bike,
          },
          {
            href: "/admin/analytics",
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
  };

  const navLinks = getNavLinks();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#142B49] text-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <Link href={`/${role || "login"}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0D9488] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                LogiPulse
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-400">
                Last-Mile Courier
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Rider Quick Availability Toggle (if Rider) */}
      {role === "rider" && !collapsed && (
        <div className="mx-4 my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Rider Status</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                riderProfile?.isAvailable
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
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
                ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
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
          <p className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group relative ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-600/30 font-semibold"
                  : link.highlight
                  ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition ${
                  isActive ? "text-white" : link.highlight ? "text-teal-400" : "text-slate-400 group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="truncate">{link.label}</span>}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop Collapse Trigger */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-slate-700/60 text-slate-400 text-xs">
        {!collapsed && <span className="text-[11px] text-slate-400">LogiPulse Platform</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
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
        className={`hidden md:block shrink-0 transition-all duration-200 border-r border-slate-800 h-screen sticky top-0 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
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
