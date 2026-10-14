"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { ridersService } from "@/services/riders.service";
import { Order, GeoLocation } from "@/types";
import { KARACHI_LOCATIONS } from "@/constants";
import { StatCard } from "@/components/dashboard/stat-card";
import { LocationSelector } from "@/components/rider/location-selector";
import { OrderCard } from "@/components/orders/order-card";
import {
  Navigation2,
  Package,
  CheckCircle2,
  Bike,
  Power,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RiderDashboardPage() {
  const { user, riderProfile, updateRiderAvailability } = useAuth();

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [currentLoc, setCurrentLoc] = useState<GeoLocation>({
    latitude: riderProfile?.currentLocation?.latitude || KARACHI_LOCATIONS[0].latitude,
    longitude: riderProfile?.currentLocation?.longitude || KARACHI_LOCATIONS[0].longitude,
  });

  // Subscribe to available unassigned orders
  useEffect(() => {
    const unsub = ordersService.subscribeAvailableOrders((orders) => {
      setAvailableOrders(orders);
    });
    return () => unsub();
  }, []);

  // Subscribe to rider's assigned orders
  useEffect(() => {
    if (!user) return;
    const unsub = ordersService.subscribeRiderOrders(user.uid, (orders) => {
      setMyOrders(orders);
    });
    return () => unsub();
  }, [user]);

  const activeDeliveries = myOrders.filter(
    (o) => o.status === "accepted" || o.status === "picked_up" || o.status === "in_transit"
  );

  const completedDeliveries = myOrders.filter((o) => o.status === "delivered");

  const handleLocationChange = async (newLoc: GeoLocation, name?: string) => {
    setCurrentLoc(newLoc);
    if (user) {
      await ridersService.updateLocation(user.uid, newLoc.latitude, newLoc.longitude);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rider Status Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#142B49] via-[#1a385f] to-[#0D9488] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-teal-300 border border-white/10">
            <Bike className="w-3.5 h-3.5 text-teal-400" /> Delivery Fleet Partner
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Welcome, {user?.fullName || "Courier Partner"}!
          </h1>
          <p className="text-xs text-slate-200 max-w-xl">
            {riderProfile?.vehicleType} • Plate: {riderProfile?.vehicleNumber || "KHI-KAS-4821"}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="z-10 flex items-center gap-2">
          <button
            onClick={() => updateRiderAvailability(!riderProfile?.isAvailable)}
            className={`py-3 px-5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              riderProfile?.isAvailable
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {riderProfile?.isAvailable ? "Status: AVAILABLE (Online)" : "Status: OFF-DUTY"}
            </span>
          </button>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Location Selector (GPS / Karachi Preset) */}
      <LocationSelector
        currentLocation={currentLoc}
        onLocationChange={handleLocationChange}
      />

      {/* Fleet Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nearby Available Orders"
          value={availableOrders.length}
          subtitle="Waiting for acceptance"
          icon={Navigation2}
          colorScheme="blue"
        />
        <StatCard
          title="Active Deliveries"
          value={activeDeliveries.length}
          subtitle="Assigned & in progress"
          icon={Package}
          colorScheme="amber"
        />
        <StatCard
          title="Completed Deliveries"
          value={riderProfile?.completedDeliveries || completedDeliveries.length}
          subtitle="Successful drop-offs"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Duty Availability"
          value={riderProfile?.isAvailable ? "Online" : "Off-Duty"}
          subtitle="Broadcast state"
          icon={Power}
          colorScheme={riderProfile?.isAvailable ? "teal" : "purple"}
        />
      </div>

      {/* Available Orders Call to Action */}
      <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Navigation2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Smart Nearby Pickup Feed ({availableOrders.length} available)
            </h3>
            <p className="text-xs text-slate-500">
              Ranked dynamically by Haversine formula from your current position in Karachi.
            </p>
          </div>
        </div>

        <Link
          href="/rider/available-orders"
          className="py-2.5 px-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
        >
          <span>Browse Nearby Deliveries</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Active Tasks In Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              My Active Deliveries ({activeDeliveries.length})
            </h2>
            <p className="text-xs text-slate-500">
              Orders assigned to you requiring pickup or drop-off progression.
            </p>
          </div>

          <Link
            href="/rider/my-deliveries"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All My Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No active deliveries in progress
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Check the Available Orders tab to accept your next nearby delivery job!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDeliveries.map((order) => (
              <OrderCard key={order.id} order={order} rolePrefix="/rider" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
