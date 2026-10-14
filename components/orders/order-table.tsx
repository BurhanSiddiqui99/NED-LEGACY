"use client";

import React, { useState, useMemo } from "react";
import { Order, OrderStatus } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { Search, Filter, ExternalLink, Package, Bike, User, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderTableProps {
  orders: Order[];
  rolePrefix?: string; // "/customer", "/rider", "/admin"
  showCustomerCol?: boolean;
}

export function OrderTable({
  orders,
  rolePrefix = "/customer",
  showCustomerCol = false,
}: OrderTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;

        const term = searchTerm.toLowerCase();
        const matchesSearch =
          order.id.toLowerCase().includes(term) ||
          order.pickupAddress.toLowerCase().includes(term) ||
          order.deliveryAddress.toLowerCase().includes(term) ||
          order.recipientName.toLowerCase().includes(term) ||
          order.packageDescription.toLowerCase().includes(term) ||
          (order.riderName && order.riderName.toLowerCase().includes(term)) ||
          (order.customerName && order.customerName.toLowerCase().includes(term));

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt as any).getTime() || 0;
        const timeB = new Date(b.createdAt as any).getTime() || 0;
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [orders, searchTerm, statusFilter, sortAsc]);

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "picked_up", label: "Picked Up" },
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, address, recipient..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-1 shrink-0 hidden sm:block" />
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === opt.value
                  ? "bg-[#142B49] text-white shadow-sm dark:bg-blue-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Order ID</th>
              {showCustomerCol && <th className="py-3.5 px-4">Customer</th>}
              <th className="py-3.5 px-4">Pickup Route</th>
              <th className="py-3.5 px-4">Delivery Route</th>
              <th className="py-3.5 px-4">Assigned Rider</th>
              <th className="py-3.5 px-4">Status</th>
              <th
                className="py-3.5 px-4 cursor-pointer select-none"
                onClick={() => setSortAsc(!sortAsc)}
              >
                <div className="flex items-center gap-1">
                  <span>Created</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={showCustomerCol ? 8 : 7}
                  className="py-12 text-center text-slate-400"
                >
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    No orders matching your criteria
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search query or status filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const detailLink =
                  rolePrefix === "/rider"
                    ? `/rider/deliveries/${order.id}`
                    : `${rolePrefix}/orders/${order.id}`;

                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(detailLink)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{order.id}
                    </td>

                    {showCustomerCol && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium truncate max-w-[120px]">
                            {order.customerName || "Customer"}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {order.pickupAddress}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {order.deliveryAddress}
                      </p>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Attn: {order.recipientName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {order.riderName ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Bike className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {order.riderName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                          Awaiting rider...
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={detailLink}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Showing {filteredOrders.length} of {orders.length} orders</span>
        <span className="text-[11px]">Click any row to open tracking details</span>
      </div>
    </div>
  );
}
