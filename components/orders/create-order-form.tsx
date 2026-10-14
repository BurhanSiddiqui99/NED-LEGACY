"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { PRIORITY_CONFIG, PRIORITY_LEVELS } from "@/constants";
import { GeoLocation, OrderPriority } from "@/types";
import { calculateDistance, formatDistance, estimateTravelTimeMinutes } from "@/lib/distance";
import { formatPKR } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  User,
  Phone,
  Navigation,
  ArrowRight,
  Loader2,
  Flame,
  AlertTriangle,
  Minus,
  LocateFixed,
  Map as MapIcon,
  Route,
  Clock,
  ShieldCheck,
  MessageSquare,
  Radio,
  Pencil,
  Warehouse as WarehouseIcon,
  Building2,
} from "lucide-react";
import { GooglePlaceSearchInput } from "@/components/maps/google-place-search-input";
import dynamic from "next/dynamic";
import { getGoogleDrivingDistance, loadGoogleMaps } from "@/lib/google-maps";
import { StatusModal } from "@/components/animations/status-modal";
import { WAREHOUSES, calculateFare, nearestWarehouse, planRoute } from "@/lib/logistics";

// Google Maps is heavy; load it after the form is interactive
const GoogleMapTracker = dynamic(
  () => import("@/components/maps/google-map-tracker").then((m) => m.GoogleMapTracker),
  { ssr: false, loading: () => <div className="h-[300px] rounded-2xl lp-skeleton" /> }
);

const inputCls =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-slate-900";
const cardCls = "bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm";

function SectionTitle({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-xl lp-brand-gradient text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-glow">
        {step}
      </span>
      <div>
        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-7">{title}</h3>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function CreateOrderForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { kind: "success"; orderId: string } | { kind: "error"; message: string } | null
  >(null);

  // Addresses start empty: the customer searches the real pickup and drop-off
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<GeoLocation | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<GeoLocation | null>(null);
  // Whether each address has been located on the map (typed text alone keeps the old pin)
  const [pickupResolved, setPickupResolved] = useState(false);
  const [deliveryResolved, setDeliveryResolved] = useState(false);

  // Package & Recipient state
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("+92 3");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageWeight, setPackageWeight] = useState("1.0");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("normal");
  // Sender / receiver city: auto-detected from each address, can be corrected by the customer
  const [originCityId, setOriginCityId] = useState<string | null>(null);
  const [destinationCityId, setDestinationCityId] = useState<string | null>(null);
  const [editCities, setEditCities] = useState(false);

  // Browser Geolocation for Pickup
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const handleDetectCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location is not supported on this device.");
      return;
    }
    setFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        // Turn the GPS fix into a readable street address when Google is available
        try {
          const googleMaps = await loadGoogleMaps();
          const { results } = await new googleMaps.Geocoder().geocode({ location: { lat: latitude, lng: longitude } });
          if (results?.[0]?.formatted_address) address = results[0].formatted_address;
        } catch {}
        setFetchingGeo(false);
        setPickupCoords({ latitude, longitude });
        setPickupAddress(address);
        setPickupResolved(true);
        setOriginCityId(null);
        toast.success("Pickup set to your current location");
      },
      (error) => {
        setFetchingGeo(false);
        toast.error(`Couldn't get your location: ${error.message}. Please search the address instead.`);
      },
      { timeout: 10000 }
    );
  };

  // Live distance and pricing calculation
  const [googleDistance, setGoogleDistance] = useState<number | null>(null);
  const [googleDuration, setGoogleDuration] = useState<string | null>(null);

  useEffect(() => {
    setGoogleDistance(null);
    setGoogleDuration(null);
    if (!pickupCoords || !deliveryCoords) return;
    let active = true;
    getGoogleDrivingDistance(pickupCoords, deliveryCoords).then((res) => {
      if (active && res) {
        setGoogleDistance(res.distanceKm);
        setGoogleDuration(res.durationText);
      }
    });
    return () => {
      active = false;
    };
  }, [pickupCoords?.latitude, pickupCoords?.longitude, deliveryCoords?.latitude, deliveryCoords?.longitude]);

  const hasRoute = !!pickupCoords && !!deliveryCoords;

  // Use real Google Maps driving road distance if available, otherwise high-precision Haversine
  const distanceKm =
    pickupCoords && deliveryCoords
      ? googleDistance ??
        calculateDistance(pickupCoords.latitude, pickupCoords.longitude, deliveryCoords.latitude, deliveryCoords.longitude)
      : 0;

  const estimatedMinutes = googleDuration ?? `~${estimateTravelTimeMinutes(distanceKm)} mins`;
  const weightNum = parseFloat(packageWeight) || 1;

  // Each address belongs to its nearest city warehouse; different warehouses = intercity delivery
  const detectedOrigin = pickupCoords ? nearestWarehouse(pickupCoords).warehouse : null;
  const detectedDestination = deliveryCoords ? nearestWarehouse(deliveryCoords).warehouse : null;
  const routePlan =
    pickupCoords && deliveryCoords
      ? planRoute(pickupCoords, deliveryCoords, {
          originWarehouseId: originCityId,
          destinationWarehouseId: destinationCityId,
        })
      : null;
  const intercity = routePlan?.deliveryType === "intercity";
  // Flat zone price (same city / same province / other province) + priority surcharge
  const prioritySurcharge = PRIORITY_CONFIG[priority].surchargePKR;
  const fare = routePlan ? calculateFare(routePlan, prioritySurcharge) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a delivery request.");
      router.push("/login");
      return;
    }

    // A typed-but-unlocated address has no reliable pin, which would put the order in the wrong city
    if (!pickupCoords || !pickupResolved) {
      toast.error("Locate the pickup address first: pick a suggestion or press Find.");
      return;
    }
    if (!deliveryCoords || !deliveryResolved || !routePlan || !fare) {
      toast.error("Locate the delivery address first: pick a suggestion or press Find.");
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Recipient name is required.");
      return;
    }

    if (!recipientPhone.trim() || recipientPhone.length < 10) {
      toast.error("Please provide a valid recipient contact phone number.");
      return;
    }

    if (!packageDescription.trim()) {
      toast.error("Package description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await ordersService.create({
        customerId: user.uid,
        customerName: user.fullName || "Customer",
        customerPhone: user.phone || "+92 300 0000000",
        customerEmail: user.email,
        deliveryType: routePlan.deliveryType,
        originCity: routePlan.originWarehouse.city,
        destinationCity: routePlan.destinationWarehouse.city,
        originWarehouseId: routePlan.originWarehouse.id,
        destinationWarehouseId: routePlan.destinationWarehouse.id,
        fareBreakdown: fare.breakdown,
        priceZone: routePlan.priceZone,
        pickupAddress,
        deliveryAddress,
        pickupLocation: pickupCoords,
        deliveryLocation: deliveryCoords,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        packageDescription: packageDescription.trim(),
        packageWeight: weightNum,
        deliveryInstructions: deliveryInstructions.trim(),
        priority,
        price: fare.total,
        estimatedDeliveryTime: intercity ? "1-3 days (intercity)" : estimatedMinutes,
      });

      setResult({ kind: "success", orderId: created.id });
      router.prefetch(`/customer/orders/${created.id}`);
    } catch (err: any) {
      setResult({ kind: "error", message: err.message || "Failed to create order" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPickupAddress("");
    setPickupCoords(null);
    setPickupResolved(false);
    setDeliveryAddress("");
    setDeliveryCoords(null);
    setDeliveryResolved(false);
    setOriginCityId(null);
    setDestinationCityId(null);
    setRecipientName("");
    setRecipientPhone("+92 3");
    setPackageDescription("");
    setPackageWeight("1.0");
    setDeliveryInstructions("");
    setPriority("normal");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StatusModal
        open={result?.kind === "success"}
        variant="packing"
        title="Parcel packed & request sent!"
        message={
          result?.kind === "success"
            ? `Order #${result.orderId} is live. Nearby riders can see it now, and you'll be notified the moment one accepts.`
            : undefined
        }
        primaryAction={{
          label: "Track my order",
          onClick: () => result?.kind === "success" && router.push(`/customer/orders/${result.orderId}`),
        }}
        secondaryAction={{
          label: "Book another delivery",
          onClick: () => {
            resetForm();
            setResult(null);
          },
        }}
        onClose={() => result?.kind === "success" && router.push(`/customer/orders/${result.orderId}`)}
      />
      <StatusModal
        open={result?.kind === "error"}
        variant="burst"
        title="Oops! The parcel burst"
        message={result?.kind === "error" ? `${result.message} Your details are still here, so you can try again.` : undefined}
        primaryAction={{ label: "Try again", onClick: () => setResult(null) }}
        onClose={() => setResult(null)}
      />

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Send a Parcel</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tell us where to pick up and deliver. You&apos;ll see the route and exact fare before you confirm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column: route, map, priority, package */}
        <div className="lg:col-span-3 space-y-6">
          {/* Route */}
          <section className={`${cardCls} space-y-5`}>
            <SectionTitle step={1} title="Pickup & drop-off" hint="Search any address, shop or landmark in Pakistan." />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <GooglePlaceSearchInput
                  id="pickup-address"
                  label="Pickup from"
                  value={pickupAddress}
                  coords={pickupCoords}
                  onChange={(addr, coords, resolved) => {
                    setPickupAddress(addr);
                    setPickupCoords(coords);
                    setPickupResolved(resolved);
                    if (resolved) setOriginCityId(null);
                  }}
                  resolved={pickupResolved}
                  placeholder="e.g. Dolmen Mall, Clifton, Karachi"
                  iconType="pickup"
                />
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={fetchingGeo}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {fetchingGeo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                  Use my current location
                </button>
              </div>

              <GooglePlaceSearchInput
                id="delivery-address"
                label="Deliver to"
                value={deliveryAddress}
                coords={deliveryCoords}
                onChange={(addr, coords, resolved) => {
                  setDeliveryAddress(addr);
                  setDeliveryCoords(coords);
                  setDeliveryResolved(resolved);
                  if (resolved) setDestinationCityId(null);
                }}
                resolved={deliveryResolved}
                placeholder="e.g. Gulshan-e-Iqbal Block 13, Karachi"
                iconType="delivery"
              />
            </div>

            {/* Detected sender & receiver city (editable) */}
            {routePlan && detectedOrigin && detectedDestination && (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 min-w-0">
                    {intercity ? (
                      <WarehouseIcon className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    ) : (
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {intercity
                        ? `${routePlan.originWarehouse.city} → ${routePlan.destinationWarehouse.city}`
                        : `Within ${routePlan.originWarehouse.city}`}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditCities((v) => !v)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0"
                  >
                    <Pencil className="w-3 h-3" /> {editCities ? "Done" : "Wrong city?"}
                  </button>
                </div>
                {editCities && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: "origin-city",
                        label: "Sender city",
                        value: originCityId ?? detectedOrigin.id,
                        detected: detectedOrigin,
                        onChange: setOriginCityId,
                      },
                      {
                        id: "destination-city",
                        label: "Receiver city",
                        value: destinationCityId ?? detectedDestination.id,
                        detected: detectedDestination,
                        onChange: setDestinationCityId,
                      },
                    ].map((f) => (
                      <div key={f.id}>
                        <label htmlFor={f.id} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          {f.label}
                        </label>
                        <select
                          id={f.id}
                          value={f.value}
                          onChange={(e) => f.onChange(e.target.value === f.detected.id ? null : e.target.value)}
                          className={inputCls}
                        >
                          {WAREHOUSES.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.city} ({w.province}){w.id === f.detected.id ? " · detected" : ""}
                            </option>
                          ))}
                        </select>
                        {f.value !== f.detected.id && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                            The address looks like {f.detected.city}. Double-check the city.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Route map: in the page flow, so it never floats over the fare card */}
          <section className={`${cardCls} space-y-4 relative isolate`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Route preview
              </h3>
              {hasRoute && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" />
                  {formatDistance(intercity && routePlan ? routePlan.directKm : distanceKm)}
                  {!intercity && ` · ${estimatedMinutes}`}
                </span>
              )}
            </div>
            {pickupCoords && deliveryCoords ? (
              <GoogleMapTracker
                pickupLocation={pickupCoords}
                pickupAddress={pickupAddress}
                deliveryLocation={deliveryCoords}
                deliveryAddress={deliveryAddress}
                status="pending"
                height="300px"
                interactive={true}
              />
            ) : (
              <div className="relative h-[220px] rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-blue-50/80 via-violet-50/60 to-pink-50/80 dark:from-blue-950/30 dark:via-slate-900 dark:to-pink-950/20 flex flex-col items-center justify-center text-center p-6">
                <div className="absolute inset-0 lp-grid-bg opacity-60" aria-hidden="true" />
                <span className="relative w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center">
                  <MapIcon className="w-6 h-6 text-violet-500" />
                </span>
                <p className="relative mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Your route will appear here
                </p>
                <p className="relative mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  {pickupCoords ? "Now add the drop-off address." : "Start by entering the pickup address above."}
                </p>
              </div>
            )}
          </section>

          {/* Delivery Priority */}
          <section className={`${cardCls} space-y-4`}>
            <SectionTitle step={2} title="How fast?" hint="Higher priority gets picked up first." />
            <div role="radiogroup" aria-label="Delivery priority" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRIORITY_LEVELS.map((level) => {
                const cfg = PRIORITY_CONFIG[level];
                const Icon = level === "urgent" ? Flame : level === "high" ? AlertTriangle : Minus;
                const selected = priority === level;
                const selectedStyle =
                  level === "urgent"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/40 ring-4 ring-red-500/15"
                    : level === "high"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-4 ring-orange-500/15"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-4 ring-blue-500/15";
                const iconTone =
                  level === "urgent" ? "text-red-500" : level === "high" ? "text-orange-500" : "text-blue-500";
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPriority(level)}
                    className={`text-left p-3.5 rounded-2xl border transition ${
                      selected
                        ? selectedStyle
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${iconTone}`} /> {cfg.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {cfg.surchargePKR ? `+PKR ${cfg.surchargePKR}` : "Free"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cfg.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recipient & Package Details */}
          <section className={`${cardCls} space-y-4`}>
            <SectionTitle step={3} title="Parcel & recipient" hint="Who is receiving it, and what's inside?" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recipient-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recipient name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="recipient-name"
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Farhan Ali"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="recipient-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recipient phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="recipient-phone"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="package-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  What are you sending? *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="package-description"
                    type="text"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="e.g. Documents, electronics, clothes"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="package-weight" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weight (kg)
                </label>
                <input
                  id="package-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="30"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="delivery-instructions" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Instructions for the rider <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="delivery-instructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Fragile, call at the gate, handle with care"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </section>
        </div>

        {/* Right Column: fare summary + submit */}
        <aside className="lg:col-span-2 lg:sticky lg:top-24">
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <div className="lp-brand-gradient px-5 sm:px-6 py-5 text-white">
              <p className="text-xs font-semibold text-white/80">Total fare</p>
              <p className="text-3xl font-extrabold tracking-tight mt-0.5">{fare ? formatPKR(fare.total) : "—"}</p>
              <p className="text-xs text-white/80 mt-1">
                {routePlan
                  ? intercity
                    ? `Intercity · ${routePlan.originWarehouse.city} → ${routePlan.destinationWarehouse.city} · 1-3 days`
                    : `Same city · ${routePlan.originWarehouse.city} · ${estimatedMinutes}`
                  : "Enter both addresses to see your fare"}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {routePlan && fare ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Route className="w-4 h-4" />
                      {intercity ? "Door-to-door distance" : googleDistance ? "Road distance" : "Distance"}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatDistance(intercity ? routePlan.directKm : distanceKm)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Estimated time
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{intercity ? "1-3 days" : estimatedMinutes}</span>
                  </div>
                  <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    {fare.breakdown.map((line) => (
                      <div key={line.label} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{line.label}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 shrink-0">PKR {line.amount}</span>
                      </div>
                    ))}
                  </div>
                  {intercity && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 rounded-xl p-2.5">
                      Picked up by a rider, sent from the {routePlan.originWarehouse.city} warehouse to{" "}
                      {routePlan.destinationWarehouse.city}, then delivered to the door.
                    </p>
                  )}
                  {(!routePlan.originInArea || !routePlan.destinationInArea) && (
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      This address is outside our usual service area, so delivery may take a little longer.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Navigation className="w-4 h-4 mt-0.5 shrink-0 text-violet-500" />
                  <p>Search your pickup and drop-off addresses. The fare updates instantly.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 lp-brand-gradient hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating delivery request...
                  </>
                ) : (
                  <>
                    <span>Request Delivery Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <ul className="grid grid-cols-3 gap-2 pt-1 text-center">
                {[
                  { icon: Radio, label: "Live tracking" },
                  { icon: MessageSquare, label: "Rider chat" },
                  { icon: ShieldCheck, label: "Code verified" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 py-2.5 px-1">
                    <Icon className="w-4 h-4 mx-auto text-violet-500" />
                    <span className="block mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
