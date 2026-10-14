"use client";

import React from "react";
import { Message } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Check, CheckCheck, ShieldCheck, Bike, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const renderRoleBadge = () => {
    if (message.senderRole === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <ShieldCheck className="w-2.5 h-2.5" /> Support Admin
        </span>
      );
    }
    if (message.senderRole === "rider") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Bike className="w-2.5 h-2.5" /> Courier Rider
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <User className="w-2.5 h-2.5" /> Customer
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col mb-3.5 ${
        isCurrentUser ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {isCurrentUser ? "You" : message.senderName || "Delivery Partner"}
        </span>
        {renderRoleBadge()}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md break-words ${
          isCurrentUser
            ? "bg-gradient-to-r from-[#039855] to-[#12B76A] text-white rounded-br-none shadow-blue-500/10"
            : message.senderRole === "admin"
            ? "bg-purple-50 dark:bg-purple-950/50 text-slate-900 dark:text-slate-100 border border-purple-200 dark:border-purple-800 rounded-bl-none"
            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none shadow-slate-200/50 dark:shadow-none"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
            isCurrentUser ? "text-blue-100/90" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <span>{formatDateTime(message.createdAt)}</span>
          {isCurrentUser && (
            message.isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-teal-300 stroke-[2.2]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-blue-200 stroke-[2.2]" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
