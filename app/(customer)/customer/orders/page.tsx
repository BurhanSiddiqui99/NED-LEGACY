"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderTable } from "@/components/orders/order-table";
import { OrderCard } from "@/components/orders/order-card";
import { PackagePlus, LayoutGrid, Table as TableIcon } from "lucide-react";
import Link from "next/link";

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeCustomerOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            My Courier Deliveries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and manage all your parcel requests in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Card grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/customer/create-order"
            className="py-2 px-3.5 bg-[#12B76A] hover:bg-[#039855] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {viewMode === "table" ? (
        <OrderTable orders={orders} rolePrefix="/customer" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} rolePrefix="/customer" />
          ))}
        </div>
      )}
    </div>
  );
}
