"use client";

import React from "react";
import { OrderStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants";
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  BadgeCheck,
  XCircle,
  Warehouse,
  Bike,
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  className?: string;
}

export function OrderStatusBadge({
  status,
  showIcon = true,
  className = "",
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const renderIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />;
      case "accepted":
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />;
      case "picked_up":
        return <PackageCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "in_transit":
        return <Truck className="w-3.5 h-3.5 text-teal-600" />;
      case "at_origin_warehouse":
      case "at_destination_warehouse":
        return <Warehouse className="w-3.5 h-3.5" />;
      case "linehaul":
      case "out_for_delivery":
        return <Truck className="w-3.5 h-3.5" />;
      case "last_mile_accepted":
        return <Bike className="w-3.5 h-3.5" />;
      case "delivered":
        return <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case "cancelled":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      {showIcon && renderIcon()}
      {config.label}
    </span>
  );
}
