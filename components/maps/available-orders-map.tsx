"use client";

import React, { useEffect, useRef, useState } from "react";
import { Order, GeoLocation } from "@/types";
import {
  loadGoogleMaps,
  createMapIcon,
  DARK_MAP_STYLE,
  LIGHT_MAP_STYLE,
  PAKISTAN_DEFAULT_CENTER,
  PAKISTAN_DEFAULT_ZOOM,
} from "@/lib/google-maps";
import { PRIORITY_CONFIG, getOrderPriority } from "@/constants";
import { PriorityBadge } from "@/components/orders/priority-badge";
import { getActiveLeg } from "@/lib/logistics";
import { RefreshCw, Package, ArrowRight, MapPin, Bike } from "lucide-react";

interface AvailableOrdersMapProps {
  orders: Order[];
  riderLocation?: GeoLocation | null;
  onSelectOrder?: (order: Order) => void;
  height?: string;
}

export function AvailableOrdersMap({
  orders,
  riderLocation,
  onSelectOrder,
  height = "420px",
}: AvailableOrdersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setLoading(true);
        const googleMaps = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const centerLat = riderLocation?.latitude || PAKISTAN_DEFAULT_CENTER.lat;
        const centerLng = riderLocation?.longitude || PAKISTAN_DEFAULT_CENTER.lng;

        const map = new googleMaps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: riderLocation ? 12 : PAKISTAN_DEFAULT_ZOOM,
          styles: isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Add Rider Position marker if available
        if (riderLocation) {
          const riderMarker = new googleMaps.Marker({
            position: { lat: riderLocation.latitude, lng: riderLocation.longitude },
            map,
            title: "Your Live Location",
            icon: createMapIcon("rider"),
            zIndex: 1000,
          });
          riderMarkerRef.current = riderMarker;
        }

        // Add Order Pickup Markers
        const bounds = new googleMaps.LatLngBounds();
        if (riderLocation) {
          bounds.extend({ lat: riderLocation.latitude, lng: riderLocation.longitude });
        }

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        orders.forEach((order) => {
          const start = getActiveLeg(order).from;
          if (!start?.latitude || !start?.longitude) return;

          const marker = new googleMaps.Marker({
            position: { lat: start.latitude, lng: start.longitude },
            map,
            title: `Order #${order.id} [${PRIORITY_CONFIG[getOrderPriority(order)].label}]: ${order.packageDescription}`,
            icon: createMapIcon("pickup"),
            label:
              getOrderPriority(order) === "normal"
                ? undefined
                : { text: "!", color: "#ffffff", fontWeight: "900", fontSize: "14px" },
            zIndex: PRIORITY_CONFIG[getOrderPriority(order)].rank * 10,
          });

          // Clicking a pin previews it; the popup button hands it to onSelectOrder
          marker.addListener("click", () => {
            setSelectedOrder(order);
          });

          markersRef.current.push(marker);
          bounds.extend({ lat: start.latitude, lng: start.longitude });
        });

        if (orders.length > 0) {
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }

        setLoading(false);
      } catch (err) {
        console.warn("Available orders map notice:", err);
        setLoading(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      if (riderMarkerRef.current) riderMarkerRef.current.setMap(null);
    };
  }, [orders, riderLocation?.latitude, riderLocation?.longitude, isDarkMode]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-950">
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height }}
        className="w-full h-full relative"
      />

      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <span className="text-xs font-semibold">Loading Live Dispatch Map...</span>
        </div>
      )}

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-[11px] font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{orders.length} Available Jobs on Map</span>
        </div>
      </div>

      {/* Bottom Popup Card for Selected Order */}
      {selectedOrder && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-20 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              #{selectedOrder.id}
              <PriorityBadge priority={getOrderPriority(selectedOrder)} />
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              PKR {selectedOrder.price}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate font-medium">{selectedOrder.packageDescription}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="truncate">{selectedOrder.pickupAddress}</span>
            </div>
          </div>

          <button
            onClick={() => onSelectOrder?.(selectedOrder)}
            className="mt-3 w-full py-2 px-3 bg-[#12B76A] hover:bg-[#039855] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <span>View Job & Accept</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
