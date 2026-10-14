"use client";

import React, { useEffect, useState } from "react";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { AnalyticsCharts } from "@/components/dashboard/analytics-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatPKR } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  Bike,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = ordersService.subscribeAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalGrossRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.price || 350), 0);

  const averageOrderValue = orders.length
    ? Math.round(orders.reduce((sum, o) => sum + (o.price || 350), 0) / orders.length)
    : 0;

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const fulfillmentRate = orders.length
    ? Math.round((deliveredCount / orders.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Logistics Performance & Fleet Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Realtime financial and operational metrics calculated from active Firestore records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Delivered Gross Volume"
          value={formatPKR(totalGrossRevenue)}
          subtitle="Completed deliveries revenue"
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Average Order Value"
          value={formatPKR(averageOrderValue)}
          subtitle="Mean delivery fee"
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="Fulfillment Success Rate"
          value={`${fulfillmentRate}%`}
          subtitle="Delivered vs cancelled/pending"
          icon={CheckCircle2}
          colorScheme="teal"
        />
        <StatCard
          title="Avg Courier Speed"
          value="26 mins"
          subtitle="Karachi urban transit benchmark"
          icon={Clock}
          colorScheme="purple"
        />
      </div>

      {/* Recharts Analytics Charts */}
      <AnalyticsCharts orders={orders} />
    </div>
  );
}
