"use client";

import React, { useState } from "react";
import { Order, Rider } from "@/types";
import { calculateDistance, formatDistance, estimateTravelTimeMinutes } from "@/lib/distance";
import { formatPKR, formatRelativeTime } from "@/lib/utils";
import { ordersService } from "@/services/orders.service";
import { PriorityBadge } from "@/components/orders/priority-badge";
import { PRIORITY_CONFIG, getOrderPriority } from "@/constants";
import { getActiveLeg, getDeliveryType } from "@/lib/logistics";
import { toast } from "sonner";
import { MapPin, ArrowRight, Package, CheckCircle, Loader2, Navigation, XCircle, Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusModal } from "@/components/animations/status-modal";

interface NearbyOrderCardProps {
  order: Order;
  rider: Rider;
  onAccepted?: (order: Order) => void;
}

const REJECT_REASONS = ["Too far from my location", "Package too heavy / large", "Going off duty soon", "Unsafe area / timing"];

export function NearbyOrderCard({ order, rider, onAccepted }: NearbyOrderCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const deliveryHref = `/rider/deliveries/${order.id}`;

  // The leg this rider would do: first mile from the customer, or last mile from the destination warehouse
  const leg = getActiveLeg(order);
  const lastMile = order.status === "at_destination_warehouse";
  const intercity = getDeliveryType(order) === "intercity";

  const pickupDistanceKm = calculateDistance(
    rider.currentLocation.latitude,
    rider.currentLocation.longitude,
    leg.from.latitude,
    leg.from.longitude
  );
  const tripDistanceKm = calculateDistance(leg.from.latitude, leg.from.longitude, leg.to.latitude, leg.to.longitude);
  const estimatedPickupTimeMin = estimateTravelTimeMinutes(pickupDistanceKm);
  const priority = getOrderPriority(order);

  const handleAccept = async () => {
    if (!rider.isAvailable) {
      toast.error("You are currently marked as Off-Duty. Set your status to Available to accept orders.");
      return;
    }

    setAccepting(true);
    try {
      router.prefetch(deliveryHref);
      const updated = await ordersService.accept(order.id, rider);
      if (onAccepted) onAccepted(updated);
      setOutcome({
        ok: true,
        message: lastMile
          ? `Go to ${leg.fromLabel}. The warehouse admin will give you a code to collect the parcel.`
          : `Head to ${order.pickupAddress.split(",")[0]}. The customer will get a code by email to verify pickup.`,
      });
    } catch (err: any) {
      setOutcome({ ok: false, message: err.message || "Failed to accept order. It may have been taken by another rider." });
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await ordersService.reject(order.id, rider, rejectReason === "Other" ? customReason : rejectReason);
      toast.info(`Order #${order.id} rejected. It stays open for other riders and the admin was notified.`);
      setRejectOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Could not reject the order");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <StatusModal
        open={outcome?.ok === true}
        variant="pickup"
        title={`Order #${order.id} is yours!`}
        message={outcome?.message}
        primaryAction={{ label: "Start delivery", onClick: () => router.push(deliveryHref) }}
        onClose={() => router.push(deliveryHref)}
      />
      <StatusModal
        open={outcome?.ok === false}
        variant="burst"
        title="Someone was faster"
        message={outcome?.message}
        primaryAction={{ label: "Back to nearby orders", onClick: () => setOutcome(null) }}
        onClose={() => setOutcome(null)}
      />

      <div
        className={`lp-lift bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 ${PRIORITY_CONFIG[priority].cardClass}`}
      >
        {/* Top Header: ID + Distance Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">#{order.id}</span>
            <PriorityBadge priority={priority} />
            {/* Job type: which leg of the delivery this rider would do */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                intercity
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  : "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800"
              }`}
            >
              {lastMile ? "Warehouse → Customer" : intercity ? "Customer → Warehouse" : "Customer → Customer"}
            </span>
            <span className="text-[11px] text-slate-400">• {formatRelativeTime(order.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{formatDistance(pickupDistanceKm)} to pickup</span>
          </div>
        </div>

        {/* Route Addresses */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              {lastMile ? <Warehouse className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {lastMile ? "Collect from warehouse" : "Pickup"} (ETA ~{estimatedPickupTimeMin} mins)
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{leg.fromLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              {intercity && !lastMile ? <Warehouse className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {intercity && !lastMile ? "Drop at warehouse" : "Deliver to"} ({formatDistance(tripDistanceKm)} ride)
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{leg.toLabel}</p>
            </div>
          </div>
        </div>

        {/* Package Description & Recipient snippet */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-100 dark:border-transparent">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Package className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              {order.packageDescription}
            </span>
            {order.packageWeight && <span className="text-slate-400 shrink-0">{order.packageWeight} kg</span>}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="truncate">Recipient: {order.recipientName}</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs shrink-0">Fee: {formatPKR(order.price || 350)}</span>
          </div>
        </div>

        {/* Reject reason picker */}
        {rejectOpen && (
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 space-y-2 animate-in fade-in duration-150">
            <p className="text-xs font-bold text-red-900 dark:text-red-200">Why are you rejecting this order?</p>
            <div className="grid gap-1">
              {[...REJECT_REASONS, "Other"].map((r) => (
                <label key={r} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name={`reject-${order.id}`}
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-red-600"
                  />
                  {r}
                </label>
              ))}
            </div>
            {rejectReason === "Other" && (
              <input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                maxLength={200}
                placeholder="Write a short reason"
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting || (rejectReason === "Other" && !customReason.trim())}
                className="py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm reject"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!rejectOpen && (
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button
              onClick={() => setRejectOpen(true)}
              className="py-2.5 px-3 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="py-2.5 px-4 bg-[#12B76A] hover:bg-[#039855] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Accept #{order.id}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
