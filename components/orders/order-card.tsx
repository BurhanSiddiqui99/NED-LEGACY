"use client";

import React from "react";
import { Order } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { formatPKR, formatRelativeTime } from "@/lib/utils";
import {
  MapPin,
  ArrowRight,
  Package,
  Calendar,
  Phone,
  MessageSquare,
  Bike,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface OrderCardProps {
  order: Order;
  rolePrefix?: string; // "/customer", "/rider", or "/admin"
}

export function OrderCard({ order, rolePrefix = "/customer" }: OrderCardProps) {
  const detailLink =
    rolePrefix === "/rider"
      ? `/rider/deliveries/${order.id}`
      : `${rolePrefix}/orders/${order.id}`;

  const chatLink = `${rolePrefix}/messages/${order.id}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
            #{order.id}
          </span>
          <span className="text-xs text-slate-400">
            • {formatRelativeTime(order.createdAt)}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Route Info */}
      <div className="py-3.5 space-y-2.5">
        <div className="flex items-start gap-2.5 text-xs">
          <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pickup From
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {order.pickupAddress}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs">
          <div className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Deliver To
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {order.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Package & Recipient */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 mb-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {order.packageDescription}
          </span>
          {order.packageWeight && (
            <span className="text-slate-400 shrink-0">{order.packageWeight} kg</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Recipient: {order.recipientName}</span>
          {order.price && (
            <span className="font-bold text-slate-900 dark:text-white">
              {formatPKR(order.price)}
            </span>
          )}
        </div>
      </div>

      {/* Rider Status snippet */}
      {order.riderId && order.riderName && (
        <div className="flex items-center justify-between text-xs py-2 px-1 mb-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Bike className="w-3.5 h-3.5 text-amber-500" />
            Rider: {order.riderName}
          </span>
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <Link
              href={chatLink}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </Link>
          )}
        </div>
      )}

      {/* Card Action footer */}
      <div className="pt-2 flex items-center justify-between gap-2">
        <Link
          href={detailLink}
          className="w-full py-2 px-3 bg-slate-100 hover:bg-[#142B49] text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
        >
          <span>View Details & Timeline</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
