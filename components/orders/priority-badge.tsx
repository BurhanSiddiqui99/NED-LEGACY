import React from "react";
import { OrderPriority } from "@/types";
import { PRIORITY_CONFIG } from "@/constants";
import { AlertTriangle, Flame, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: OrderPriority;
  size?: "sm" | "md";
  // Hide the badge for NORMAL orders where it would only add noise
  hideNormal?: boolean;
}

const ICONS: Record<OrderPriority, React.ElementType> = {
  normal: Minus,
  high: AlertTriangle,
  urgent: Flame,
};

export function PriorityBadge({ priority, size = "sm", hideNormal = false }: PriorityBadgeProps) {
  if (hideNormal && priority === "normal") return null;

  const config = PRIORITY_CONFIG[priority];
  const Icon = ICONS[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider shrink-0 ${
        config.badgeClass
      } ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${
        priority === "urgent" ? "animate-pulse" : ""
      }`}
      title={config.description}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}
