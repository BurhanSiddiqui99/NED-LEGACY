"use client";

import React, { useEffect, useState, useRef } from "react";
import { Message, Order } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { messagesService } from "@/services/messages.service";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { toast } from "sonner";
import { getChatAvailability } from "@/lib/chat";
import {
  MessageSquare,
  Bike,
  User,
  Clock,
  Phone,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
  Radio,
} from "lucide-react";
import Link from "next/link";

interface ChatWindowProps {
  order: Order;
  backHref?: string;
}

export function ChatWindow({ order, backHref }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?.uid === order.customerId;
  const isRider = user?.uid === order.riderId;
  const isAdmin = user?.role === "admin";

  // Determine active conversation counterpart
  const receiverId = isCustomer
    ? order.riderId || "admin"
    : isRider
    ? order.customerId || "admin"
    : order.riderId || order.customerId;

  const receiverName = isCustomer
    ? order.riderName || "LogiPulse Support Dispatch"
    : isRider
    ? order.customerName || "Customer"
    : `Order #${order.id} Participants`;

  const receiverPhone = isCustomer ? order.riderPhone : order.customerPhone;

  // Riders can only chat on the order they currently hold; admins see history but cannot post into a closed chat
  const chat = getChatAvailability(order, user?.role === "rider" ? user.uid : undefined);

  useEffect(() => {
    if (!order.id) return;

    const unsub = messagesService.subscribe(
      order.id,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        toast.error(
          err.message?.includes("permission")
            ? "Chat blocked by Firestore rules. Publish the latest firestore.rules."
            : "Chat connection lost. Retrying..."
        );
      }
    );

    return () => unsub();
  }, [order.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;
    try {
      await messagesService.send(
        order.id,
        user.uid,
        receiverId,
        text,
        user.fullName || (isAdmin ? "Support Admin" : isRider ? "Courier Rider" : "Customer"),
        (user.role as any) || (isAdmin ? "admin" : isRider ? "rider" : "customer")
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver message");
      throw err;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[75vh] max-h-[720px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#039855] to-[#12B76A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
            {isAdmin ? (
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            ) : isCustomer ? (
              <Bike className="w-5 h-5 text-amber-300" />
            ) : (
              <User className="w-5 h-5 text-teal-300" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {receiverName}
              </h3>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                Live Chat
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-mono font-medium">Order #{order.id}</span>
              {receiverPhone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" /> {receiverPhone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Closed-chat banner: cancelled, delivered, or no rider assigned yet */}
      {!chat.open && (
        <div
          className={`px-4 py-2 border-b flex items-center gap-2 text-xs ${
            order.status === "cancelled"
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
          }`}
          role="status"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{chat.reason}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/40 dark:bg-slate-950/50">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Connecting real-time conversation channel...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Real-Time Courier Communication
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Send a message regarding pickup timing, nearby landmarks, gate numbers, or delivery instructions.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.senderId === user?.uid}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!chat.open}
      />
    </div>
  );
}
