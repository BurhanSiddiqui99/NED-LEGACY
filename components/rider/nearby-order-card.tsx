"use client";

import React, { useState } from "react";
import { Order, Rider } from "@/types";
import { calculateDistance, formatDistance, estimateTravelTimeMinutes } from "@/lib/distance";
import { formatPKR, formatRelativeTime } from "@/lib/utils";
import { ordersService } from "@/services/orders.service";
import { toast } from "sonner";
import {
  MapPin,
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  Loader2,
  Navigation,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NearbyOrderCardProps {
  order: Order;
  rider: Rider;
  onAccepted?: (order: Order) => void;
}

export function NearbyOrderCard({
  order,
  rider,
  onAccepted,
}: NearbyOrderCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  // Dynamic Haversine distance from rider's current position to the pickup location
  const pickupDistanceKm = calculateDistance(
    rider.currentLocation.latitude,
    rider.currentLocation.longitude,
    order.pickupLocation.latitude,
    order.pickupLocation.longitude
  );

  // Delivery distance from pickup to destination
  const tripDistanceKm = calculateDistance(
    order.pickupLocation.latitude,
    order.pickupLocation.longitude,
    order.deliveryLocation.latitude,
    order.deliveryLocation.longitude
  );

  const estimatedPickupTimeMin = estimateTravelTimeMinutes(pickupDistanceKm);

  const handleAccept = async () => {
    if (!rider.isAvailable) {
      toast.error("You are currently marked as Off-Duty. Set your status to Available to accept orders.");
      return;
    }

    setAccepting(true);
    try {
      const updated = await ordersService.accept(order.id, rider);
      toast.success(`You have successfully accepted delivery #${order.id}!`);
      if (onAccepted) onAccepted(updated);
      router.push(`/rider/deliveries/${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order. It may have been taken by another rider.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4">
      {/* Top Header: ID + Distance Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
            #{order.id}
          </span>
          <span className="text-[11px] text-slate-400">
            • {formatRelativeTime(order.createdAt)}
          </span>
        </div>

        {/* Dynamic Distance from Rider Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{formatDistance(pickupDistanceKm)} to pickup</span>
        </div>
      </div>

      {/* Route Addresses */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5 text-xs">
          <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Pickup (ETA ~{estimatedPickupTimeMin} mins)
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {order.pickupAddress}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs">
          <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Destination ({formatDistance(tripDistanceKm)} ride)
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {order.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Package Description & Recipient snippet */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-100 dark:border-transparent">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <Package className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            {order.packageDescription}
          </span>
          {order.packageWeight && (
            <span className="text-slate-400 shrink-0">{order.packageWeight} kg</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <span>Recipient: {order.recipientName}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs">
            Fee: {formatPKR(order.price || 350)}
          </span>
        </div>
      </div>

      {/* Accept Action */}
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
      >
        {accepting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Assigning Order...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Accept Order (#{order.id})
          </>
        )}
      </button>
    </div>
  );
}
