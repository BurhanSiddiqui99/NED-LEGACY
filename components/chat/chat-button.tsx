"use client";

import React from "react";
import Link from "next/link";
import { Order } from "@/types";
import { getChatAvailability } from "@/lib/chat";
import { Lock, MessageSquare } from "lucide-react";

interface ChatButtonProps {
  order: Pick<Order, "id" | "status" | "riderId">;
  href: string;
  label: string;
  className: string;
  // Set when the viewer is a rider, so only the rider holding the order can chat
  riderUid?: string;
  iconClassName?: string;
}

/** Chat link that stays visible but disabled (with the reason) when the chat is closed. */
export function ChatButton({ order, href, label, className, riderUid, iconClassName = "w-4 h-4" }: ChatButtonProps) {
  const { open, reason } = getChatAvailability(order, riderUid);

  if (open) {
    return (
      <Link href={href} className={className}>
        <MessageSquare className={iconClassName} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <span
      role="button"
      aria-disabled="true"
      title={reason}
      className={`${className} !bg-none !bg-slate-200 dark:!bg-slate-800 !text-slate-400 dark:!text-slate-500 !shadow-none cursor-not-allowed hover:no-underline`}
    >
      <Lock className={iconClassName} />
      <span>{label}</span>
    </span>
  );
}
