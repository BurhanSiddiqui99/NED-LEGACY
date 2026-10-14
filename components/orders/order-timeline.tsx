"use client";

import React from "react";
import { Order, OrderStatus, VerificationCheckpoint } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { WORKFLOW_STEPS, getDeliveryType, getWarehouse } from "@/lib/logistics";
import { Check, Clock, PackageCheck, Truck, BadgeCheck, XCircle, Warehouse, Bike, ShieldCheck } from "lucide-react";

interface OrderTimelineProps {
  order: Order;
}

type StepInfo = { title: string; description: string; icon: React.ElementType; checkpoint?: VerificationCheckpoint };

function describe(order: Order, status: OrderStatus): StepInfo {
  const originWh = getWarehouse(order.originWarehouseId);
  const destWh = getWarehouse(order.destinationWarehouseId);
  const intercity = getDeliveryType(order) === "intercity";
  switch (status) {
    case "pending":
      return { title: "Delivery Requested", description: "Order placed, visible to nearby riders", icon: Clock };
    case "accepted":
      return {
        title: "Rider Assigned",
        description: order.firstMileRiderName || order.riderName ? `${order.firstMileRiderName || order.riderName} accepted the order` : "Rider heading to pickup",
        icon: Bike,
      };
    case "picked_up":
      return { title: "Picked Up", description: "Customer verified the pickup with an emailed code", icon: PackageCheck, checkpoint: "pickup" };
    case "in_transit":
      return {
        title: intercity ? "To Origin Warehouse" : "In Transit",
        description: intercity ? `Riding to ${originWh?.name || "the city warehouse"}` : "Rider on the way to the drop-off",
        icon: Truck,
      };
    case "at_origin_warehouse":
      return {
        title: `At ${originWh?.city || "Origin"} Warehouse`,
        description: "Customer and admin verified the drop-off",
        icon: Warehouse,
        checkpoint: "origin_warehouse",
      };
    case "linehaul":
      return { title: "Between Cities", description: `${order.originCity} → ${order.destinationCity} warehouse transfer`, icon: Truck };
    case "at_destination_warehouse":
      return { title: `At ${destWh?.city || "Destination"} Warehouse`, description: "Arrived; waiting for a last-mile rider", icon: Warehouse };
    case "last_mile_accepted":
      return { title: "Last-Mile Rider Assigned", description: order.riderName ? `${order.riderName} is collecting the parcel` : "Rider heading to the warehouse", icon: Bike };
    case "out_for_delivery":
      return { title: "Out for Delivery", description: "Admin verified the warehouse handover", icon: PackageCheck, checkpoint: "warehouse_handover" };
    case "delivered":
      return { title: "Delivered", description: "Customer verified the delivery with an emailed code", icon: BadgeCheck, checkpoint: "delivery" };
    default:
      return { title: status, description: "", icon: Clock };
  }
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  if (order.status === "cancelled") {
    return (
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3">
        <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">This order has been cancelled</h4>
          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">Cancelled {formatDateTime(order.updatedAt)}</p>
        </div>
      </div>
    );
  }

  const statuses = WORKFLOW_STEPS[getDeliveryType(order)];
  const currentIndex = statuses.indexOf(order.status);
  const reachedAt = (status: OrderStatus) => {
    const entry = [...(order.statusHistory || [])].reverse().find((h) => h.status === status);
    if (entry) return entry.at;
    if (status === "pending") return order.createdAt;
    if (status === "accepted") return order.acceptedAt;
    if (status === "delivered") return order.deliveredAt;
    return undefined;
  };

  return (
    <div className="py-4">
      <div className="relative">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />
        <ol className="space-y-5">
          {statuses.map((status, idx) => {
            const step = describe(order, status);
            const isCompleted = idx < currentIndex || order.status === "delivered";
            const isCurrent = idx === currentIndex && order.status !== "delivered";
            const Icon = step.icon;
            const at = isCompleted || isCurrent ? reachedAt(status) : undefined;
            const verified = step.checkpoint && order.verifications?.[step.checkpoint]?.completedAt;

            return (
              <li key={status} className="relative flex items-start gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition shadow-sm ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                      : isCurrent
                      ? "bg-[#12B76A] text-white ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4 stroke-[2.2]" />}
                </div>
                <div className="flex-1 pt-0.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? "text-[#12B76A] dark:text-blue-400"
                          : isCompleted
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.title}
                    </h4>
                    {at && <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatDateTime(at)}</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>
                  {verified && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" /> OTP verified
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
