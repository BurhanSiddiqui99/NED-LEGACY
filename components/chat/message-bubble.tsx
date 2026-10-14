"use client";

import React from "react";
import { Message } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col mb-3 ${
        isCurrentUser ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <span className="text-[10px] font-semibold text-slate-400">
          {isCurrentUser ? "You" : message.senderName || "Delivery Partner"}
        </span>
      </div>

      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm break-words ${
          isCurrentUser
            ? "bg-[#2563EB] text-white rounded-br-none"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
            isCurrentUser ? "text-blue-100" : "text-slate-400"
          }`}
        >
          <span>{formatDateTime(message.createdAt)}</span>
          {isCurrentUser && (
            message.isRead ? (
              <CheckCheck className="w-3 h-3 text-teal-300" />
            ) : (
              <Check className="w-3 h-3 text-blue-200" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
