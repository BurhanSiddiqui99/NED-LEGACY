"use client";

import React from "react";
import { Order, OrderStatus } from "@/types";
import { ParcelScene, ParcelSceneVariant } from "@/components/animations/parcel-scenes";
import { Check } from "lucide-react";
import { getDeliveryType } from "@/lib/logistics";

// Compact progress steps; each covers one or more workflow statuses
const STEPS: Record<"intracity" | "intercity", { label: string; statuses: OrderStatus[] }[]> = {
  intracity: [
    { label: "Requested", statuses: ["pending"] },
    { label: "Rider Assigned", statuses: ["accepted"] },
    { label: "Picked Up", statuses: ["picked_up"] },
    { label: "On the Way", statuses: ["in_transit"] },
    { label: "Delivered", statuses: ["delivered"] },
  ],
  intercity: [
    { label: "Requested", statuses: ["pending", "accepted"] },
    { label: "Picked Up", statuses: ["picked_up", "in_transit"] },
    { label: "Origin Hub", statuses: ["at_origin_warehouse"] },
    { label: "Between Cities", statuses: ["linehaul"] },
    { label: "Destination Hub", statuses: ["at_destination_warehouse", "last_mile_accepted"] },
    { label: "Delivery", statuses: ["out_for_delivery", "delivered"] },
  ],
};

const SCENE: Record<OrderStatus, ParcelSceneVariant> = {
  pending: "searching",
  accepted: "pickup",
  picked_up: "pickup",
  in_transit: "transit",
  at_origin_warehouse: "packing",
  linehaul: "transit",
  at_destination_warehouse: "searching",
  last_mile_accepted: "pickup",
  out_for_delivery: "transit",
  delivered: "delivered",
  cancelled: "burst",
};

function headline(order: Order, viewer: "customer" | "admin"): { title: string; subtitle: string } {
  const intercity = getDeliveryType(order) === "intercity";
  const rider = order.riderName || "Your rider";
  const you = viewer === "customer";
  switch (order.status) {
    case "pending":
      return {
        title: "Finding a nearby rider…",
        subtitle: you
          ? "Your parcel is packed and waiting. Nearby riders can see it right now."
          : "Broadcasting to riders ranked by distance and priority.",
      };
    case "accepted":
      return { title: `${rider} is heading to pickup`, subtitle: "The rider accepted the order and is riding to the pickup point." };
    case "picked_up":
      return { title: `${rider} has your parcel`, subtitle: "The package was collected from the sender." };
    case "in_transit":
      return intercity
        ? { title: `Heading to the ${order.originCity} warehouse`, subtitle: `${rider} is taking the parcel to the hub for intercity transfer.` }
        : { title: "On the way to the destination", subtitle: `${rider} is riding to the drop-off. Track them live on the map.` };
    case "at_origin_warehouse":
      return { title: `At the ${order.originCity} warehouse`, subtitle: "Received and verified. Waiting for dispatch to the destination city." };
    case "linehaul":
      return { title: `${order.originCity} → ${order.destinationCity}`, subtitle: "Your parcel is travelling between our city warehouses." };
    case "at_destination_warehouse":
      return { title: `Arrived in ${order.destinationCity}`, subtitle: "At the destination warehouse. Assigning a local delivery rider." };
    case "last_mile_accepted":
      return { title: `${rider} will deliver it`, subtitle: `The rider is heading to the ${order.destinationCity} warehouse to collect your parcel.` };
    case "out_for_delivery":
      return { title: "Out for delivery", subtitle: `${rider} is riding to the drop-off. Keep your delivery code ready.` };
    case "delivered":
      return { title: "Delivered!", subtitle: "The parcel was handed to the recipient." };
    case "cancelled":
      return { title: "Order cancelled", subtitle: "This delivery request was cancelled." };
  }
}

/** Animated status banner that replays its scene whenever the live order status changes. */
export function OrderStatusHero({ order, viewer = "customer" }: { order: Order; viewer?: "customer" | "admin" }) {
  const { title, subtitle } = headline(order, viewer);
  const steps = STEPS[getDeliveryType(order)];
  const currentIdx = steps.findIndex((s) => s.statuses.includes(order.status));
  const cancelled = order.status === "cancelled";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-blue-50/60 to-teal-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 shadow-sm">
      <div className="lp-blob w-48 h-48 bg-blue-400 -top-16 -right-10" />
      <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-6 p-5 sm:p-6">
        <div className="shrink-0">
          <ParcelScene key={order.status} variant={SCENE[order.status]} size={210} />
        </div>
        <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-1.5">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>

          {!cancelled && (
            <ol
              className={`pt-3 grid gap-1 ${steps.length === 6 ? "grid-cols-6" : "grid-cols-5"}`}
              aria-label="Delivery progress"
            >
              {steps.map((step, idx) => {
                const done = idx < currentIdx || order.status === "delivered";
                const current = idx === currentIdx && order.status !== "delivered";
                return (
                  <li key={step.label} className="flex flex-col items-center sm:items-start gap-1.5 min-w-0">
                    <div className="flex items-center w-full gap-1">
                      <span
                        className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                          done
                            ? "bg-emerald-500 text-white"
                            : current
                            ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                        aria-current={current ? "step" : undefined}
                      >
                        {done ? <Check className="w-3 h-3" /> : idx + 1}
                      </span>
                      {idx < steps.length - 1 && (
                        <span className="hidden sm:block flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <span
                            className={`block h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-700 ${
                              done ? "w-full" : current ? "w-1/2" : "w-0"
                            }`}
                          />
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] leading-tight font-semibold truncate max-w-full ${
                        done || current ? "text-slate-900 dark:text-white" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
