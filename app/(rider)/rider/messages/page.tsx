"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatPKR } from "@/lib/utils";
import {
  MessageSquare,
  User,
  Clock,
  ArrowRight,
  Package,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function RiderMessagesHubPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeRiderOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Customer & Dispatch Courier Chats
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Communicate directly with parcel senders and control room dispatch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading assigned communication channels...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No Assigned Delivery Chats
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Accept an available order from the marketplace to start communicating with customers.
          </p>
          <Link
            href="/rider/available-orders"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
          >
            <span>View Available Orders</span>
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
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #{order.id}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Customer: {order.customerName || "Parcel Sender"}
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
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">Destination: {order.deliveryAddress}</span>
                    <span className="font-bold text-emerald-600 shrink-0">
                      PKR {order.price || 350}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/rider/messages/${order.id}`}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Courier Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
