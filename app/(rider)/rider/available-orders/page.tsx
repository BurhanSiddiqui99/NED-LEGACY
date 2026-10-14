"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { ridersService } from "@/services/riders.service";
import { Order, GeoLocation, OrderPriority } from "@/types";
import {
  PAKISTAN_LOCATIONS,
  PRIORITY_CONFIG,
  PRIORITY_LEVELS,
  getOrderPriority,
  getPriorityScore,
} from "@/constants";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { toMillis } from "@/lib/firebase/firestore";
import { getActiveLeg, getOrderStartWarehouseId, getWarehouse, nearestWarehouse } from "@/lib/logistics";
import { LocationSelector } from "@/components/rider/location-selector";
import { RiderCityCard } from "@/components/rider/rider-city-card";
import { NearbyOrderCard } from "@/components/rider/nearby-order-card";
import { PriorityBadge } from "@/components/orders/priority-badge";
import {
  Filter,
  ArrowUpDown,
  Search,
  Package,
  Sparkles,
  Map,
  List,
  Flame,
  Scale,
} from "lucide-react";
import dynamic from "next/dynamic";

// Only downloaded when the rider switches to the map view
const AvailableOrdersMap = dynamic(
  () => import("@/components/maps/available-orders-map").then((m) => m.AvailableOrdersMap),
  { ssr: false, loading: () => <div className="h-[540px] rounded-3xl lp-skeleton" /> }
);

type SortMode = "smart" | "nearest" | "priority" | "newest";

type RankedOrder = Order & {
  calculatedDistanceKm: number;
  priorityLevel: OrderPriority;
  decisionScore: number;
};

export default function AvailableOrdersPage() {
  const { user, riderProfile, riderWarehouseId } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Rider position
  const [riderLocation, setRiderLocation] = useState<GeoLocation>({
    latitude: riderProfile?.currentLocation?.latitude || PAKISTAN_LOCATIONS[0].latitude,
    longitude: riderProfile?.currentLocation?.longitude || PAKISTAN_LOCATIONS[0].longitude,
  });

  // Filter & Sort State
  const [distanceFilter, setDistanceFilter] = useState<string>("all"); // "all", "2km", "5km", "10km", "25km"
  const [priorityFilter, setPriorityFilter] = useState<"all" | OrderPriority>("all");
  const [sortBy, setSortBy] = useState<SortMode>("smart");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    const unsub = ordersService.subscribeAvailableOrders((data) => {
      // Orders this rider rejected stay open for everyone else but leave this rider's feed
      setOrders(data.filter((o) => !user || !o.rejectedBy?.includes(user.uid)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleLocationChange = async (newLoc: GeoLocation) => {
    setRiderLocation(newLoc);
    if (user) {
      await ridersService.updateLocation(user.uid, newLoc.latitude, newLoc.longitude);
    }
  };

  // Riders only see jobs that start in their registered home city
  const riderCity = useMemo(
    () => getWarehouse(riderWarehouseId) || nearestWarehouse(riderLocation).warehouse,
    [riderWarehouseId, riderLocation]
  );
  const otherCityCount = useMemo(
    () => orders.filter((o) => getOrderStartWarehouseId(o) !== riderCity.id).length,
    [orders, riderCity.id]
  );

  // Every order gets a live Haversine distance from the rider, then a decision score
  // that combines that distance with its priority weight (lower score = better pick).
  const rankedOrders: RankedOrder[] = useMemo(() => {
    return orders
      .filter((order) => getOrderStartWarehouseId(order) === riderCity.id)
      .map((order) => {
        // First-mile jobs start at the customer; last-mile jobs start at the destination warehouse
        const start = getActiveLeg(order).from;
        const distKm = calculateDistance(riderLocation.latitude, riderLocation.longitude, start.latitude, start.longitude);
        const priorityLevel = getOrderPriority(order);
        return {
          ...order,
          calculatedDistanceKm: distKm,
          priorityLevel,
          decisionScore: getPriorityScore(distKm, priorityLevel),
        };
      });
  }, [orders, riderLocation, riderCity.id]);

  const processedOrders = useMemo(() => {
    const maxKm = { all: Infinity, "2km": 2, "5km": 5, "10km": 10, "25km": 25 }[distanceFilter] ?? Infinity;

    return rankedOrders
      .filter((order) => {
        if (order.calculatedDistanceKm > maxKm) return false;
        if (priorityFilter !== "all" && order.priorityLevel !== priorityFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            order.id.toLowerCase().includes(q) ||
            order.pickupAddress.toLowerCase().includes(q) ||
            order.deliveryAddress.toLowerCase().includes(q) ||
            order.packageDescription.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "nearest":
            return a.calculatedDistanceKm - b.calculatedDistanceKm;
          case "priority": {
            const rankDiff = PRIORITY_CONFIG[b.priorityLevel].rank - PRIORITY_CONFIG[a.priorityLevel].rank;
            return rankDiff !== 0 ? rankDiff : a.calculatedDistanceKm - b.calculatedDistanceKm;
          }
          case "newest":
            return toMillis(b.createdAt) - toMillis(a.createdAt);
          default:
            return a.decisionScore - b.decisionScore;
        }
      });
  }, [rankedOrders, distanceFilter, priorityFilter, sortBy, searchQuery]);

  const nearestOrder = useMemo(
    () => [...rankedOrders].sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm)[0],
    [rankedOrders]
  );
  const recommendedOrder = useMemo(
    () => [...rankedOrders].sort((a, b) => a.decisionScore - b.decisionScore)[0],
    [rankedOrders]
  );

  const priorityCounts = useMemo(() => {
    const counts: Record<OrderPriority, number> = { normal: 0, high: 0, urgent: 0 };
    rankedOrders.forEach((o) => counts[o.priorityLevel]++);
    return counts;
  }, [rankedOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Smart Nearby Pickup Feed
            </h1>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Your city: {riderCity.city}
            </span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              Live Radar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Jobs in {riderCity.city} only, ranked by Haversine distance from your position and weighted by priority.
            {otherCityCount > 0 && ` ${otherCityCount} job(s) in other cities are hidden.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nearestOrder && (
            <div className="p-2 px-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-teal-900 dark:text-teal-200">
                Nearest: #{nearestOrder.id} ({formatDistance(nearestOrder.calculatedDistanceKm)})
              </span>
            </div>
          )}
          {recommendedOrder && recommendedOrder.id !== nearestOrder?.id && (
            <div className="p-2 px-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs">
              <Flame className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-900 dark:text-red-200">
                Recommended: #{recommendedOrder.id} ({PRIORITY_CONFIG[recommendedOrder.priorityLevel].label},{" "}
                {formatDistance(recommendedOrder.calculatedDistanceKm)})
              </span>
            </div>
          )}
        </div>
      </div>

      <RiderCityCard />

      {/* Rider Position Bar */}
      <LocationSelector currentLocation={riderLocation} onLocationChange={handleLocationChange} city={riderCity.city} />

      {/* Filter and Sorting Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pickup area, package..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="smart">Smart: Distance + Priority</option>
              <option value="nearest">Nearest Pickup First</option>
              <option value="priority">Highest Priority First</option>
              <option value="newest">Newest Requested First</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "map"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Google Map</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Distance Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Radius:
            </span>
            {[
              { id: "all", label: `All ${riderCity.city}` },
              { id: "2km", label: "2 km" },
              { id: "5km", label: "5 km" },
              { id: "10km", label: "10 km" },
              { id: "25km", label: "25 km" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setDistanceFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  distanceFilter === chip.id
                    ? "bg-[#039855] text-white shadow-sm dark:bg-blue-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Priority Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 lg:ml-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Flame className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Priority:
            </span>
            {(["all", ...PRIORITY_LEVELS] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  priorityFilter === p
                    ? "bg-[#039855] text-white shadow-sm dark:bg-blue-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p === "all" ? `All (${rankedOrders.length})` : `${PRIORITY_CONFIG[p].label} (${priorityCounts[p]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day 2: Rider decision view (distance vs priority at a glance) */}
      {processedOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" /> Rider Decision View
            </h2>
            <span className="text-[11px] text-slate-500">
              Score = distance ÷ priority weight (Normal ×1, High ×{PRIORITY_CONFIG.high.weight}, Urgent ×
              {PRIORITY_CONFIG.urgent.weight}). Lower is better.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Distance</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Decision Score</th>
                  <th className="py-2.5 px-4">Pickup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {processedOrders.slice(0, 8).map((order, idx) => (
                  <tr key={order.id} className={PRIORITY_CONFIG[order.priorityLevel].rowClass}>
                    <td className="py-2 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-4 font-mono font-bold text-slate-900 dark:text-white">#{order.id}</td>
                    <td className="py-2 px-4 font-semibold">{formatDistance(order.calculatedDistanceKm)}</td>
                    <td className="py-2 px-4">
                      <PriorityBadge priority={order.priorityLevel} />
                    </td>
                    <td className="py-2 px-4 font-mono">{order.decisionScore.toFixed(2)}</td>
                    <td className="py-2 px-4 truncate max-w-[220px]">{order.pickupAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Orders: Map View or List View */}
      {viewMode === "map" ? (
        <AvailableOrdersMap
          orders={processedOrders}
          riderLocation={riderLocation}
          height="540px"
          onSelectOrder={(order) => {
            // Jump to the order's card in list view, where it can be accepted
            setSearchQuery(order.id);
            setViewMode("list");
          }}
        />
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          Loading available orders...
        </div>
      ) : processedOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No Available Orders Match These Filters
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Switch the radius to &quot;All {riderCity.city}&quot; or clear the priority filter. You only see jobs in your registered city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lp-stagger">
          {processedOrders.map((order) => (
            <NearbyOrderCard
              key={order.id}
              order={order}
              rider={{
                ...(riderProfile || {
                  uid: user?.uid || "demo-rider-uid",
                  fullName: user?.fullName || "Tariq Mahmood",
                  phone: user?.phone,
                  vehicleType: "Honda CD 70",
                  vehicleNumber: "KHI-KAS-4821",
                  isAvailable: true,
                  isVerified: true,
                  completedDeliveries: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }),
                // Always measure from the position selected on this page
                currentLocation: riderLocation,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
