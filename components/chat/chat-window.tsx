"use client";

import React, { useEffect, useState, useRef } from "react";
import { Message, Order } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { messagesService } from "@/services/messages.service";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { toast } from "sonner";
import {
  MessageSquare,
  Bike,
  User,
  Clock,
  Phone,
  ShieldAlert,
  ArrowLeft,
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

  const receiverId = isCustomer
    ? order.riderId || ""
    : order.customerId;

  const receiverName = isCustomer
    ? order.riderName || "Delivery Rider"
    : order.customerName || "Customer";

  const receiverPhone = isCustomer ? order.riderPhone : order.customerPhone;

  useEffect(() => {
    if (!order.id) return;

    const unsub = messagesService.subscribe(order.id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

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
        user.fullName || "Partner"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver message");
      throw err;
    }
  };

  if (!order.riderId || order.status === "pending") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Awaiting Rider Acceptance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          One-to-one courier chat will automatically activate as soon as a rider accepts Order #{order.id}.
        </p>
        {backHref && (
          <Link
            href={backHref}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Order
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[75vh] max-h-[700px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#142B49] to-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {isCustomer ? <Bike className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {receiverName}
              </h3>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Live Chat
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span>Order #{order.id}</span>
              {receiverPhone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5" /> {receiverPhone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/40 dark:bg-slate-950/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Direct Courier Conversation
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1">
              Send a message to coordinate pickup timing, landmarks, or delivery instructions.
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
        disabled={order.status === "delivered" || order.status === "cancelled"}
      />
    </div>
  );
}
