"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getRoleNavLinks } from "./sidebar";

/** Thumb-reachable tab bar for phones; mirrors the first four sidebar links of the current role. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const links = getRoleNavLinks(role).filter((l) => l.shortLabel).slice(0, 4);

  if (links.length === 0) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                  active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-blue-600 dark:bg-blue-400" />}
                <span
                  className={`p-1.5 rounded-xl transition ${
                    link.highlight && !active
                      ? "bg-gradient-to-tr from-[#027A48] to-[#12B76A] text-white shadow-md shadow-blue-500/30"
                      : active
                      ? "bg-blue-50 dark:bg-blue-950/60"
                      : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                {link.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
