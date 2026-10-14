"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { ridersService } from "@/services/riders.service";
import { Order, GeoLocation } from "@/types";
import { KARACHI_LOCATIONS } from "@/constants";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { LocationSelector } from "@/components/rider/location-selector";
import { NearbyOrderCard } from "@/components/rider/nearby-order-card";
import {
  Navigation2,
  Filter,
  ArrowUpDown,
  Search,
  Package,
  Sparkles,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function AvailableOrdersPage() {
  const { user, riderProfile } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Rider position
  const [riderLocation, setRiderLocation] = useState<GeoLocation>({
    latitude: riderProfile?.currentLocation?.latitude || KARACHI_LOCATIONS[0].latitude,
    longitude: riderProfile?.currentLocation?.longitude || KARACHI_LOCATIONS[0].longitude,
  });

  // Filter & Sort State
  const [distanceFilter, setDistanceFilter] = useState<string>("all"); // "all", "2km", "5km", "10km"
  const [sortBy, setSortBy] = useState<"nearest" | "newest">("nearest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = ordersService.subscribeAvailableOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLocationChange = async (newLoc: GeoLocation) => {
    setRiderLocation(newLoc);
    if (user) {
      await ridersService.updateLocation(user.uid, newLoc.latitude, newLoc.longitude);
    }
  };

  // Filtered and Sorted Orders using live Haversine calculations
  const processedOrders = useMemo(() => {
    return orders
      .map((order) => {
        const distKm = calculateDistance(
          riderLocation.latitude,
          riderLocation.longitude,
          order.pickupLocation.latitude,
          order.pickupLocation.longitude
        );
        return {
          ...order,
          calculatedDistanceKm: distKm,
        };
      })
      .filter((order) => {
        // Distance Filter
        if (distanceFilter === "2km" && order.calculatedDistanceKm > 2) return false;
        if (distanceFilter === "5km" && order.calculatedDistanceKm > 5) return false;
        if (distanceFilter === "10km" && order.calculatedDistanceKm > 10) return false;

        // Search Filter
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
        if (sortBy === "nearest") {
          return a.calculatedDistanceKm - b.calculatedDistanceKm;
        } else {
          const timeA = new Date(a.createdAt as any).getTime() || 0;
          const timeB = new Date(b.createdAt as any).getTime() || 0;
          return timeB - timeA;
        }
      });
  }, [orders, riderLocation, distanceFilter, sortBy, searchQuery]);

  const nearestOrder = processedOrders[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Smart Nearby Pickup Feed
            </h1>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              Live Radar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending unassigned deliveries ranked by dynamically calculated Haversine distance.
          </p>
        </div>

        {nearestOrder && (
          <div className="p-2 px-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-teal-900 dark:text-teal-200">
              Nearest: Order #{nearestOrder.id} ({formatDistance(nearestOrder.calculatedDistanceKm)})
            </span>
          </div>
        )}
      </div>

      {/* Rider Position Bar */}
      <LocationSelector
        currentLocation={riderLocation}
        onLocationChange={handleLocationChange}
      />

      {/* Filter and Sorting Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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

        {/* Distance Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Radius:
          </span>
          {[
            { id: "all", label: "All Karachi" },
            { id: "2km", label: "Within 2 km" },
            { id: "5km", label: "Within 5 km" },
            { id: "10km", label: "Within 10 km" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setDistanceFilter(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                distanceFilter === chip.id
                  ? "bg-[#142B49] text-white shadow-sm dark:bg-blue-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="nearest">Nearest Pickup First</option>
            <option value="newest">Newest Requested First</option>
          </select>
        </div>
      </div>

      {/* Available Orders Grid */}
      {processedOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No Available Orders in Selected Radius
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try switching the distance radius filter to &quot;All Karachi&quot; or update your current rider position above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedOrders.map((order) => (
            <NearbyOrderCard
              key={order.id}
              order={order}
              rider={
                riderProfile || {
                  uid: user?.uid || "demo-rider-uid",
                  fullName: user?.fullName || "Tariq Mahmood",
                  vehicleType: "Honda CD 70",
                  vehicleNumber: "KHI-KAS-4821",
                  isAvailable: true,
                  isVerified: true,
                  currentLocation: riderLocation,
                  completedDeliveries: 42,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
