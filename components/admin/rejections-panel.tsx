"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { CLAIMABLE_STATUSES } from "@/lib/logistics";
import { XCircle } from "lucide-react";

/** Open orders that riders have turned down, newest rejection first, so ops can step in. */
export function RejectionsPanel({ orders }: { orders: Order[] }) {
  const rejected = useMemo(
    () =>
      orders
        .filter((o) => (o.rejections?.length || 0) > 0 && CLAIMABLE_STATUSES.includes(o.status) && !o.riderId)
        .map((o) => ({ order: o, last: o.rejections![o.rejections!.length - 1] }))
        .sort((a, b) => b.last.at.localeCompare(a.last.at)),
    [orders]
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" /> Rejected by Riders ({rejected.length})
        </h2>
        <span className="text-[11px] text-slate-500">Still open for other nearby riders</span>
      </div>
      {rejected.length === 0 ? (
        <p className="text-xs text-slate-400">No open order has been rejected.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rejected.slice(0, 6).map(({ order, last }) => (
            <li key={order.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  #{order.id}
                </Link>
                <span className="ml-2 text-slate-600 dark:text-slate-300">
                  {last.riderName}: “{last.reason}”
                </span>
              </div>
              <span className="shrink-0 text-[11px] text-slate-400">
                {order.rejections!.length}× · {formatRelativeTime(last.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
