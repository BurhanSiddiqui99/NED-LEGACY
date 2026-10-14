"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatPKR } from "@/lib/utils";
import {
  MessageSquare,
  Bike,
  User,
  Clock,
  ArrowRight,
  Package,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function CustomerMessagesHubPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeCustomerOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Courier Delivery Conversations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate live with assigned riders and LogiPulse support dispatch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading conversation channels...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No Active Conversations
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Book a delivery request to chat in real time with riders and dispatch.
          </p>
          <Link
            href="/customer/create-order"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
          >
            <span>Book New Delivery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #{order.id}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {order.riderName || "Support Dispatch (Pending Rider)"}
                      </p>
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{order.packageDescription}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    To: {order.recipientName} ({order.deliveryAddress})
                  </p>
                </div>
              </div>

              <Link
                href={`/customer/messages/${order.id}`}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#142B49] to-[#2563EB] hover:opacity-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Real-Time Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
