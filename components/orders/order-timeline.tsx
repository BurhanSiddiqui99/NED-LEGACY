"use client";

import React from "react";
import { Order, OrderStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Check, Clock, PackageCheck, Truck, BadgeCheck, XCircle } from "lucide-react";

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const steps: {
    key: OrderStatus;
    title: string;
    description: string;
    timestamp?: any;
    icon: any;
  }[] = [
    {
      key: "pending",
      title: "Delivery Requested",
      description: "Order placed by customer, awaiting nearby rider",
      timestamp: order.createdAt,
      icon: Clock,
    },
    {
      key: "accepted",
      title: "Rider Assigned",
      description: order.riderName
        ? `${order.riderName} accepted the order`
        : "Assigned rider en route to pickup location",
      timestamp: order.acceptedAt,
      icon: PackageCheck,
    },
    {
      key: "picked_up",
      title: "Package Picked Up",
      description: "Package received and secured for transport",
      timestamp: order.status === "picked_up" || order.status === "in_transit" || order.status === "delivered" ? order.updatedAt : undefined,
      icon: PackageCheck,
    },
    {
      key: "in_transit",
      title: "In Transit",
      description: "Courier out on the road towards destination",
      timestamp: order.status === "in_transit" || order.status === "delivered" ? order.updatedAt : undefined,
      icon: Truck,
    },
    {
      key: "delivered",
      title: "Delivered",
      description: "Handed over to recipient with confirmation",
      timestamp: order.deliveredAt,
      icon: BadgeCheck,
    },
  ];

  if (order.status === "cancelled") {
    return (
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3">
        <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
            This order has been cancelled
          </h4>
          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
            Cancellation timestamp: {formatDateTime(order.updatedAt)}
          </p>
        </div>
      </div>
    );
  }

  const statusOrder: OrderStatus[] = ["pending", "accepted", "picked_up", "in_transit", "delivered"];
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <div className="py-4">
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex > idx || order.status === "delivered";
            const isCurrent = currentIndex === idx && order.status !== "delivered";
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Node icon circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition shadow-sm ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                      : isCurrent
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? "text-[#2563EB] dark:text-blue-400"
                          : isCompleted
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.title}
                    </h4>
                    {step.timestamp && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDateTime(step.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
