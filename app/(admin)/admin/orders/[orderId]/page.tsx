"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PriorityBadge } from "@/components/orders/priority-badge";
import { PRIORITY_CONFIG, PRIORITY_LEVELS, getOrderPriority, isTrackable } from "@/constants";
import { OrderPriority } from "@/types";
import { toast } from "sonner";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { calculateDistance, formatDistance } from "@/lib/distance";
import {
  MapPin,
  ArrowRight,
  Package,
  Bike,
  User,
  Phone,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { GoogleMapTracker } from "@/components/maps/google-map-tracker";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPriority, setSavingPriority] = useState(false);

  const handlePriorityChange = async (priority: OrderPriority) => {
    if (!order || priority === getOrderPriority(order)) return;
    setSavingPriority(true);
    try {
      await ordersService.updatePriority(order.id, priority);
      toast.success(`Order #${order.id} set to ${PRIORITY_CONFIG[priority].label} priority`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update priority");
    } finally {
      setSavingPriority(false);
    }
  };

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
        <span className="text-xs text-slate-400">Loading master order view...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-white">Order Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No delivery found with ID #{orderId}.
        </p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B49] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Orders
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                Order #{order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
              <PriorityBadge priority={getOrderPriority(order)} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Master Logistics Record • Created {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/messages/${order.id}`}
          className="py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Open Real-Time Chat</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Google Maps Master Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Live Google Maps Fleet Telemetry Radar
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                Master Admin View
              </span>
            </div>
            <GoogleMapTracker
              pickupLocation={order.pickupLocation}
              pickupAddress={order.pickupAddress}
              deliveryLocation={order.deliveryLocation}
              deliveryAddress={order.deliveryAddress}
              riderLocation={isTrackable(order) ? order.currentRiderLocation : null}
              riderUpdatedAt={order.riderLocationUpdatedAt}
              riderName={order.riderName}
              status={order.status}
              height="360px"
              interactive={true}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Delivery Milestones Tracking
            </h2>
            <OrderTimeline order={order} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Transit Coordinates
              </h2>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                {formatDistance(tripDistance)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Origin (Pickup)
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.pickupAddress}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Lat: {order.pickupLocation.latitude.toFixed(4)}, Long: {order.pickupLocation.longitude.toFixed(4)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Destination (Drop-off)
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.deliveryAddress}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Lat: {order.deliveryLocation.latitude.toFixed(4)}, Long: {order.deliveryLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Rider, Package */}
        <div className="space-y-6">
          {/* Day 2: Priority escalation */}
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delivery Priority</h3>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={savingPriority}
                    onClick={() => handlePriorityChange(level)}
                    className={`py-2 rounded-xl text-xs font-bold border transition disabled:opacity-50 ${
                      getOrderPriority(order) === level
                        ? PRIORITY_CONFIG[level].badgeClass
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {PRIORITY_CONFIG[level].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Escalating notifies the assigned rider and customer instantly.
              </p>
            </div>
          )}

          {/* Customer */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Customer Account
            </h3>
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">
                {order.customerName || "Customer"}
              </p>
              <p className="text-slate-500">{order.customerPhone || "N/A"}</p>
              <span className="text-[10px] font-mono text-slate-400 block">UID: {order.customerId}</span>
            </div>
          </div>

          {/* Rider */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-500" /> Assigned Courier
            </h3>
            {order.riderId ? (
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  {order.riderName}
                </p>
                <p className="text-slate-500">{order.riderPhone || "N/A"}</p>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {order.riderVehicle}
                </p>
                <span className="text-[10px] font-mono text-slate-400 block">Rider UID: {order.riderId}</span>
              </div>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                Awaiting rider assignment...
              </p>
            )}
          </div>

          {/* Package Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[2.2]" /> Package & Recipient
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Recipient</span>
                <span className="font-semibold">{order.recipientName} ({order.recipientPhone})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Package</span>
                <span className="font-semibold truncate max-w-[150px]">{order.packageDescription}</span>
              </div>
              {order.packageWeight && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-semibold">{order.packageWeight} kg</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center font-bold">
                <span>Fee</span>
                <span className="text-blue-600 dark:text-blue-400 text-sm">
                  {formatPKR(order.price || 350)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
