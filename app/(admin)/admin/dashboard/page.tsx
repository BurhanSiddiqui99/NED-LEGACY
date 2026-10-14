"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isActiveStatus } from "@/lib/logistics";
import { ordersService } from "@/services/orders.service";
import { ridersService } from "@/services/riders.service";
import { usersService } from "@/services/users.service";
import { AppUser, Order, Rider } from "@/types";
import { StatCard } from "@/components/dashboard/stat-card";
import dynamic from "next/dynamic";

// Recharts is ~100 kB; split it out so the stats render first
const AnalyticsCharts = dynamic(
  () => import("@/components/dashboard/analytics-chart").then((m) => m.AnalyticsCharts),
  { ssr: false, loading: () => <div className="h-80 rounded-2xl lp-skeleton" /> }
);
import { OrderTable } from "@/components/orders/order-table";
import { PriorityAnalytics } from "@/components/dashboard/priority-analytics";
import { RejectionsPanel } from "@/components/admin/rejections-panel";
import {
  Package,
  Users,
  Bike,
  Clock,
  Truck,
  CheckCircle2,
  Radio,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = ordersService.subscribeAllOrders((data) => setOrders(data));
    const unsubRiders = ridersService.subscribeRiders((data) => setRiders(data));
    const unsubUsers = usersService.subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubRiders();
      unsubUsers();
    };
  }, []);

  const totalCustomers = users.filter((u) => u.role === "customer").length;
  const totalRiders = riders.length;
  const availableRiders = riders.filter((r) => r.isAvailable).length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeDeliveries = orders.filter(
    (o) => isActiveStatus(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl lp-brand-gradient text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> Logistics Master Admin
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            LogiPulse Pakistan Operations Center
          </h1>
          <p className="text-xs text-white/80 max-w-xl">
            Live operations overview across senders, active motorcycle couriers, delivery milestones, and fleet capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="py-2.5 px-4 bg-white hover:bg-white/90 text-violet-700 font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-lg shadow-black/10 hover:-translate-y-0.5"
          >
            <Package className="w-4 h-4" />
            <span>Manage All Orders</span>
          </Link>
        </div>
      </div>

      {/* 7 Core Overview Statistics Cards (Section 10 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lp-stagger">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          subtitle="Registered sender accounts"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Total Riders"
          value={totalRiders}
          subtitle="Registered courier fleet"
          icon={Bike}
          colorScheme="purple"
        />
        <StatCard
          title="Available Riders"
          value={availableRiders}
          subtitle="Ready for pickup broadcast"
          icon={Radio}
          colorScheme="teal"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          subtitle="System lifetime requests"
          icon={Package}
          colorScheme="blue"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          subtitle="Awaiting rider assignment"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Active Deliveries"
          value={activeDeliveries}
          subtitle="En route right now"
          icon={Truck}
          colorScheme="teal"
        />
        <StatCard
          title="Completed Orders"
          value={completedOrders}
          subtitle="Successfully fulfilled"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
      </div>

      {/* Day 2: live NORMAL / HIGH / URGENT counts */}
      <PriorityAnalytics orders={orders} />

      <RejectionsPanel orders={orders} />

      {/* Recharts Visualizations */}
      <AnalyticsCharts orders={orders} />

      {/* Realtime Master Orders Management Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Live Fleet Dispatches ({orders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Realtime feed of all parcels, assigned riders, and statuses.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Full Orders Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OrderTable orders={orders} rolePrefix="/admin" showCustomerCol={true} />
      </div>
    </div>
  );
}
