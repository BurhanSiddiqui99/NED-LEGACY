"use client";

import React, { useState } from "react";
import { Order, OrderStatus } from "@/types";
import { ordersService } from "@/services/orders.service";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  PackageCheck,
  Truck,
  BadgeCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface DeliveryStatusActionsProps {
  order: Order;
  riderUid: string;
  onStatusUpdated?: (updatedOrder: Order) => void;
}

export function DeliveryStatusActions({
  order,
  riderUid,
  onStatusUpdated,
}: DeliveryStatusActionsProps) {
  const [updating, setUpdating] = useState(false);

  if (order.riderId !== riderUid) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
        You are not assigned to this delivery.
      </div>
    );
  }

  const handleUpdate = async (nextStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await ordersService.updateStatus(order.id, nextStatus, riderUid);

      if (nextStatus === "delivered") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success(`🎉 Delivery #${order.id} marked as DELIVERED! Great job!`);
      } else {
        toast.success(`Delivery status updated to ${nextStatus.replace("_", " ").toUpperCase()}`);
      }

      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Delivery Milestone Progress
        </span>
        <span className="text-[11px] text-slate-400 capitalize">
          Current: {order.status.replace("_", " ")}
        </span>
      </div>

      {order.status === "accepted" && (
        <button
          onClick={() => handleUpdate("picked_up")}
          disabled={updating}
          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PackageCheck className="w-4 h-4" />
          )}
          <span>Confirm Package Picked Up from Sender</span>
        </button>
      )}

      {order.status === "picked_up" && (
        <button
          onClick={() => handleUpdate("in_transit")}
          disabled={updating}
          className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Truck className="w-4 h-4" />
          )}
          <span>Mark as In Transit (Out for Delivery)</span>
        </button>
      )}

      {order.status === "in_transit" && (
        <button
          onClick={() => handleUpdate("delivered")}
          disabled={updating}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BadgeCheck className="w-4 h-4" />
          )}
          <span>Complete Delivery (Handed to Recipient)</span>
        </button>
      )}

      {order.status === "delivered" && (
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4" />
          <span>Delivery Successfully Completed & Archived</span>
        </div>
      )}
    </div>
  );
}
