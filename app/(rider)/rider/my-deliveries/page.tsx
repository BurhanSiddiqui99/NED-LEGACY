"use client";

import { ChatButton } from "@/components/chat/chat-button";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { DeliveryStatusActions } from "@/components/rider/delivery-status-actions";
import { isActiveStatus } from "@/lib/logistics";
import { formatDateTime, formatPKR } from "@/lib/utils";
import {
  Package,
  MapPin,
  ArrowRight,
  MessageSquare,
  Phone,
  Bike,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function MyDeliveriesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeRiderOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Active = this rider currently holds the parcel. Completed = delivered, or this rider's
  // first-mile leg ended at the origin warehouse.
  const activeOrders = orders.filter((o) => o.riderId === user?.uid && isActiveStatus(o.status));
  const completedOrders = orders.filter((o) => !activeOrders.includes(o) && o.status !== "cancelled" && o.status !== "pending");

  const displayOrders = activeTab === "active" ? activeOrders : completedOrders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            My Delivery Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your assigned parcels and advance delivery milestones in sequence.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("active")}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              activeTab === "active"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Active Deliveries ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              activeTab === "completed"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Completed History ({completedOrders.length})
          </button>
        </div>
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {activeTab === "active"
              ? "No active delivery assignments"
              : "No completed deliveries recorded yet"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {activeTab === "active"
              ? "Head over to the Available Orders feed to claim jobs near your location."
              : "Completed delivery records will be preserved here."}
          </p>
          {activeTab === "active" && (
            <Link
              href="/rider/available-orders"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#12B76A] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <span>Explore Available Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {order.price ? formatPKR(order.price) : "PKR 450"}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Addresses */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pickup Address
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Delivery Address
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipient & Customer Contacts */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span>Recipient: {order.recipientName}</span>
                    <span className="text-slate-500 font-mono">{order.recipientPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Sender: {order.customerName || "Customer"}</span>
                    <ChatButton
                      order={order}
                      riderUid={user?.uid || ""}
                      href={`/rider/messages/${order.id}`}
                      label="Chat with Sender"
                      iconClassName="w-3 h-3"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold rounded-md px-1.5 py-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Status Update Control Section */}
              <div className="pt-2">
                <DeliveryStatusActions
                  order={order}
                  riderUid={user?.uid || ""}
                />

                <div className="pt-3 text-right">
                  <Link
                    href={`/rider/deliveries/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <span>Full Delivery View & Timeline</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
