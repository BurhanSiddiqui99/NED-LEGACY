"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ordersService } from "@/services/orders.service";
import { useAuth } from "@/contexts/auth-context";
import { Order } from "@/types";
import { WAREHOUSES, getDeliveryType, getNextTransition, getWarehouse, nearestWarehouse } from "@/lib/logistics";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PriorityBadge } from "@/components/orders/priority-badge";
import { getOrderPriority } from "@/constants";
import { formatRelativeTime } from "@/lib/utils";
import { OtpEntry } from "@/components/orders/otp-entry";
import { toast } from "sonner";
import {
  Warehouse,
  PackageOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bike,
  BadgeCheck,
  Loader2,
  ArrowRight,
  Scale,
  Building2,
  Clock,
} from "lucide-react";

type Bucket = "pending" | "stock" | "incoming" | "outgoing" | "toDeliver" | "delivered";

interface WarehouseStats {
  pending: Order[]; // new requests in this city still waiting for a rider
  stock: Order[]; // physically inside the warehouse now
  incoming: Order[]; // first-mile riders bringing parcels in + line-haul arriving
  outgoing: Order[]; // line-haul leaving for another city
  toDeliver: Order[]; // arrived here, still to be delivered to the customer
  delivered: Order[]; // delivered in this city (same-city and intercity)
  cityActive: number; // same-city deliveries in progress (they skip the warehouse)
}

function emptyStats(): WarehouseStats {
  return { pending: [], stock: [], incoming: [], outgoing: [], toDeliver: [], delivered: [], cityActive: 0 };
}

const WAREHOUSE_STATUSES = ["at_origin_warehouse", "linehaul", "at_destination_warehouse", "last_mile_accepted", "out_for_delivery"];

/**
 * Warehouse an order belongs to at one end. Older orders were saved without warehouse ids,
 * so fall back to the stored city name, then to the hub nearest the address.
 */
function resolveWarehouseId(id: string | undefined, city: string | undefined, point: Order["pickupLocation"] | undefined) {
  if (getWarehouse(id)) return id!;
  const byCity = city && WAREHOUSES.find((w) => w.city.toLowerCase() === city.toLowerCase());
  if (byCity) return byCity.id;
  if (point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) return nearestWarehouse(point).warehouse.id;
  return null;
}

/** Puts each order in the right buckets for its origin and destination warehouses. */
function computeStats(orders: Order[]): Record<string, WarehouseStats> {
  const stats: Record<string, WarehouseStats> = Object.fromEntries(WAREHOUSES.map((w) => [w.id, emptyStats()]));

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const originId = resolveWarehouseId(o.originWarehouseId, o.originCity, o.pickupLocation);
    const destId = resolveWarehouseId(o.destinationWarehouseId, o.destinationCity, o.deliveryLocation);
    const origin = originId ? stats[originId] : undefined;
    const dest = destId ? stats[destId] : undefined;

    if (o.status === "pending") {
      origin?.pending.push(o);
      continue;
    }
    if (o.status === "delivered") {
      dest?.delivered.push(o);
      continue;
    }

    // Orders saved before deliveryType existed: a warehouse status still marks them intercity
    const intercity = getDeliveryType(o) === "intercity" || WAREHOUSE_STATUSES.includes(o.status);
    if (!intercity) {
      if (origin) origin.cityActive++;
      continue;
    }

    switch (o.status) {
      case "accepted":
      case "picked_up":
      case "in_transit":
        if (origin) origin.incoming.push(o);
        break;
      case "at_origin_warehouse":
        if (origin) origin.stock.push(o);
        break;
      case "linehaul":
        if (origin) origin.outgoing.push(o);
        if (dest) dest.incoming.push(o);
        break;
      case "at_destination_warehouse":
      case "last_mile_accepted":
        if (dest) {
          dest.stock.push(o);
          dest.toDeliver.push(o);
        }
        break;
      case "out_for_delivery":
        if (dest) dest.toDeliver.push(o);
        break;
    }
  }
  return stats;
}

const BUCKETS: { key: Bucket; label: string; icon: React.ElementType; tone: string }[] = [
  { key: "pending", label: "Awaiting pickup", icon: Clock, tone: "text-orange-600 dark:text-orange-400" },
  { key: "stock", label: "In stock", icon: PackageOpen, tone: "text-indigo-600 dark:text-indigo-400" },
  { key: "incoming", label: "Incoming", icon: ArrowDownToLine, tone: "text-blue-600 dark:text-blue-400" },
  { key: "outgoing", label: "Outgoing", icon: ArrowUpFromLine, tone: "text-amber-600 dark:text-amber-400" },
  { key: "toDeliver", label: "To deliver", icon: Bike, tone: "text-teal-600 dark:text-teal-400" },
  { key: "delivered", label: "Delivered", icon: BadgeCheck, tone: "text-emerald-600 dark:text-emerald-400" },
];

export default function AdminWarehousesPage() {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(WAREHOUSES[0].id);
  const [bucket, setBucket] = useState<Bucket>("stock");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = ordersService.subscribeAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => computeStats(orders), [orders]);
  const selected = WAREHOUSES.find((w) => w.id === selectedId)!;
  const selectedStats = stats[selectedId] || emptyStats();
  const list = selectedStats[bucket];

  const totals = useMemo(
    () =>
      BUCKETS.reduce(
        (acc, b) => ({ ...acc, [b.key]: Object.values(stats).reduce((n, s) => n + s[b.key].length, 0) }),
        {} as Record<Bucket, number>
      ),
    [stats]
  );

  const runStep = async (order: Order) => {
    const t = getNextTransition(order);
    if (!user || !t || t.actor !== "admin") return;
    setBusyId(order.id);
    try {
      await ordersService.advance(order.id, t.to, { uid: user.uid, role, name: user.fullName });
      toast.success(`#${order.id}: ${t.label}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const weight = (list: Order[]) => list.reduce((kg, o) => kg + (o.packageWeight || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> City Warehouses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Live parcels per city: new requests, warehouse stock, inbound and outbound line-haul, and deliveries. {loading ? "" : `${orders.length} orders tracked.`}
        </p>
      </div>

      {/* Network totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lp-stagger">
        {BUCKETS.map((b) => (
          <div key={b.key} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <b.icon className={`w-3.5 h-3.5 ${b.tone}`} /> {b.label}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{loading ? "–" : totals[b.key]}</p>
            <p className="text-[10px] text-slate-400">across all hubs</p>
          </div>
        ))}
      </div>

      {/* Warehouse grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {WAREHOUSES.map((w) => {
          const s = stats[w.id];
          const stockCount = s.stock.length;
          const utilization = Math.min(100, Math.round((stockCount / w.capacityParcels) * 100));
          const active = w.id === selectedId;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              aria-pressed={active}
              className={`lp-lift text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border shadow-sm transition ${
                active ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{w.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{w.address}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {w.city}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {[
                  ["New", s.pending.length],
                  ["Stock", s.stock.length],
                  ["In", s.incoming.length],
                  ["Out", s.outgoing.length],
                  ["Deliver", s.toDeliver.length],
                ].map(([label, n]) => (
                  <div key={label as string} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 py-1.5">
                    <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{n}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Capacity used</span>
                  <span>
                    {stockCount}/{w.capacityParcels}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(utilization, stockCount ? 2 : 0)}%` }}
                  />
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {s.cityActive} same-city active
                </span>
                <span className="flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-emerald-500" /> {s.delivered.length} delivered
                </span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected warehouse detail */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">{selected.name}</h2>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Scale className="w-3 h-3" /> {weight(selectedStats.stock).toFixed(1)} kg in stock · service radius {selected.serviceRadiusKm} km
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BUCKETS.map((b) => (
              <button
                key={b.key}
                onClick={() => setBucket(b.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  bucket === b.key
                    ? "lp-brand-gradient text-white shadow-glow"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {b.label} ({selectedStats[b.key].length})
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            <PackageOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            Nothing here right now.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((o) => {
              const t = getNextTransition(o);
              const adminStep = t?.actor === "admin" ? t : null;
              // Rider is at this hub and has emailed themselves the admin code
              const adminOtp =
                t?.checkpoint &&
                t.parties?.includes("admin") &&
                o.verifications?.[t.checkpoint]?.challenges?.admin &&
                !o.verifications?.[t.checkpoint]?.verifiedBy?.admin
                  ? t.checkpoint
                  : null;
              return (
                <li key={o.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        #{o.id}
                      </Link>
                      <PriorityBadge priority={getOrderPriority(o)} hideNormal />
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {o.originCity} → {o.destinationCity} · {o.packageDescription}
                      {o.packageWeight ? ` · ${o.packageWeight} kg` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {o.riderName && o.riderId ? `Rider: ${o.riderName} · ` : ""}Updated {formatRelativeTime(o.updatedAt)}
                    </p>
                  </div>
                  {adminOtp && (
                    <div className="sm:w-64 shrink-0 space-y-1">
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        {o.riderName || "Rider"} is here: enter their code
                      </p>
                      <OtpEntry order={o} checkpoint={adminOtp} party="admin" compact />
                    </div>
                  )}
                  {adminStep && (
                    <button
                      onClick={() => runStep(o)}
                      disabled={busyId === o.id}
                      className="self-start sm:self-auto py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      {adminStep.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
