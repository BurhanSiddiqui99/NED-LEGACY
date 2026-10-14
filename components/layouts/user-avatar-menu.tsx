"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types";
import {
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Bike,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserAvatarMenu() {
  const { user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium text-white bg-[#142B49] hover:bg-[#0f2138] rounded-xl transition shadow-sm"
      >
        Sign In
      </Link>
    );
  }

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case "customer":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            <UserCircle className="w-3 h-3" /> Customer
          </span>
        );
      case "rider":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            <Bike className="w-3 h-3" /> Rider
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        );
    }
  };


  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  const getProfileLink = () => {
    if (role === "customer") return "/customer/profile";
    if (role === "rider") return "/rider/profile";
    return "/admin/settings";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#142B49] to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-900">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {user.fullName}
          </span>
          <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Signed in as</span>
              {role && getRoleBadge(role)}
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>

          <div className="p-2 space-y-1">
            <Link
              href={getProfileLink()}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <User className="w-4 h-4 text-slate-400" />
              Manage Profile & Details
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
