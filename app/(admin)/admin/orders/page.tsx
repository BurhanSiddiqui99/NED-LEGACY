"use client";

import React, { useEffect, useState } from "react";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderTable } from "@/components/orders/order-table";
import { Package, Filter, Download } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = ordersService.subscribeAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("No orders to export.");
      return;
    }
    const headers = ["Order ID", "Customer", "Rider", "Pickup", "Delivery", "Status", "Price", "Created At"];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName || "Customer"}"`,
      `"${o.riderName || "Unassigned"}"`,
      `"${o.pickupAddress.replace(/"/g, '""')}"`,
      `"${o.deliveryAddress.replace(/"/g, '""')}"`,
      o.status,
      o.price || 0,
      typeof o.createdAt === "object" && "seconds" in o.createdAt ? new Date(o.createdAt.seconds * 1000).toISOString() : String(o.createdAt),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `logipulse_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV file successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            All Courier Orders Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized registry of customer delivery bookings, active courier assignments, and historical manifests.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 self-start"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Manifest (CSV)</span>
        </button>
      </div>

      <OrderTable
        orders={orders}
        rolePrefix="/admin"
        showCustomerCol={true}
      />
    </div>
  );
}
