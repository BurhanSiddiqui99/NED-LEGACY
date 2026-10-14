"use client";

import React, { useState } from "react";
import { Order } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { getDeliveryType, getNextTransition, getWarehouse } from "@/lib/logistics";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight, Loader2, Truck, Warehouse, XCircle } from "lucide-react";

/**
 * Admin-side operations for one order: warehouse steps that belong to the admin
 * (dispatch line-haul, confirm arrival) and the log of riders who rejected the order.
 */
export function OrderOpsPanel({ order }: { order: Order }) {
  const { user, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const transition = getNextTransition(order);
  const intercity = getDeliveryType(order) === "intercity";
  const originWh = getWarehouse(order.originWarehouseId);
  const destWh = getWarehouse(order.destinationWarehouseId);

  const runAdminStep = async () => {
    if (!user || !transition) return;
    setBusy(true);
    try {
      await ordersService.advance(order.id, transition.to, { uid: user.uid, role, name: user.fullName });
      toast.success(`Order #${order.id}: ${transition.label}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const rejections = order.rejections || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <Warehouse className="w-4 h-4 text-indigo-500" /> Operations
      </h3>

      {intercity ? (
        <div className="text-xs space-y-1 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
          <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> {originWh?.name} → {destWh?.name}
          </p>
          {order.firstMileRiderName && <p className="text-slate-500">First mile: {order.firstMileRiderName}</p>}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Within-city delivery: no warehouse steps.</p>
      )}

      {transition?.actor === "admin" && (
        <button
          onClick={runAdminStep}
          disabled={busy}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {transition.label}
        </button>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 text-red-500" /> Rider rejections ({rejections.length})
        </p>
        {rejections.length === 0 ? (
          <p className="text-[11px] text-slate-400">No rider has rejected this order.</p>
        ) : (
          <ul className="space-y-1.5">
            {rejections.map((r, i) => (
              <li key={`${r.riderId}-${i}`} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{r.riderName}</span>
                  <span className="text-slate-400">{formatRelativeTime(r.at)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {r.reason} · {r.leg === "last_mile" ? "last mile" : "first mile"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
