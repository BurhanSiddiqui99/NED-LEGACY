"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { DeliveryStatusActions } from "@/components/rider/delivery-status-actions";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { calculateDistance, formatDistance } from "@/lib/distance";
import {
  MapPin,
  ArrowRight,
  Package,
  User,
  Phone,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Navigation,
} from "lucide-react";
import Link from "next/link";

export default function RiderDeliveryDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const unsub = ordersService.subscribeById(orderId, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs text-slate-400">Loading delivery details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-white">Delivery Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No delivery found with reference #{orderId}.
        </p>
        <Link
          href="/rider/my-deliveries"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B49] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Deliveries
        </Link>
      </div>
    );
  }

  const tripDistance = calculateDistance(
    order.pickupLocation.latitude,
    order.pickupLocation.longitude,
    order.deliveryLocation.latitude,
    order.deliveryLocation.longitude
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/rider/my-deliveries"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                #{order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned to you • Fee: {formatPKR(order.price || 400)}
            </p>
          </div>
        </div>

        {order.status !== "delivered" && order.status !== "cancelled" && (
          <Link
            href={`/rider/messages/${order.id}`}
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Customer</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tracking timeline & Address details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestone Action Controller */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Milestone Progression Controls
            </h2>
            <DeliveryStatusActions
              order={order}
              riderUid={user?.uid || ""}
            />
          </div>

          {/* Timeline View */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Status Progression History
            </h2>
            <OrderTimeline order={order} />
          </div>

          {/* Route details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Transit Route
              </h2>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                {formatDistance(tripDistance)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Pickup Location
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {order.pickupAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Drop-off Destination
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Recipient Specs */}
        <div className="space-y-6">
          {/* Customer / Sender Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Sender Contact
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">
                {order.customerName || "Verified Customer"}
              </p>
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-mono">{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500" /> Recipient Details
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">
                {order.recipientName}
              </p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-mono">{order.recipientPhone}</span>
              </div>
            </div>
          </div>

          {/* Package Specs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[2.2]" /> Package Info
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Contents</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.packageDescription}
                </span>
              </div>

              {order.packageWeight && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.packageWeight} kg
                  </span>
                </div>
              )}

              {order.deliveryInstructions && (
                <div className="pt-2">
                  <span className="text-slate-500 block text-[11px] mb-1">
                    Special Handling Instructions
                  </span>
                  <p className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-[11px]">
                    {order.deliveryInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
