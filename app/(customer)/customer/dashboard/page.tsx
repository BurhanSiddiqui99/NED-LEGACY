"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isActiveStatus } from "@/lib/logistics";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderTable } from "@/components/orders/order-table";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  PackagePlus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeCustomerOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Derived statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeDeliveries = orders.filter(
    (o) => isActiveStatus(o.status)
  ).length;
  const completedDeliveries = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl lp-brand-gradient text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/20">
            <Sparkles className="w-3 h-3 text-amber-300" /> Customer Control Panel
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Hello, {user?.fullName || "Courier Sender"}
          </h1>
          <p className="text-xs text-white/80 max-w-xl">
            Book rapid on-demand courier deliveries across Pakistan, track live riders, and coordinate pickups seamlessly.
          </p>
        </div>

        <Link
          href="/customer/create-order"
          className="z-10 py-3 px-5 bg-white hover:bg-white/90 text-violet-700 font-extrabold rounded-2xl text-xs transition flex items-center gap-2 shadow-lg shadow-black/10 hover:-translate-y-0.5 shrink-0"
        >
          <PackagePlus className="w-4 h-4" />
          <span>New Courier Delivery</span>
        </Link>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lp-stagger">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          subtitle="All lifetime dispatches"
          icon={Package}
          colorScheme="blue"
        />
        <StatCard
          title="Pending Riders"
          value={pendingOrders}
          subtitle="Looking for nearby riders"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Active Deliveries"
          value={activeDeliveries}
          subtitle="On the road with courier"
          icon={Truck}
          colorScheme="teal"
        />
        <StatCard
          title="Delivered Safely"
          value={completedDeliveries}
          subtitle="Successfully handed over"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Orders & Tracking
            </h2>
            <p className="text-xs text-slate-500">
              Live Firestore updates synchronized with rider progress
            </p>
          </div>

          <Link
            href="/customer/orders"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({totalOrders})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OrderTable orders={orders} rolePrefix="/customer" />
      </div>
    </div>
  );
}
