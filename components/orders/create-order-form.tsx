"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { PAKISTAN_LOCATIONS, PRIORITY_CONFIG, PRIORITY_LEVELS } from "@/constants";
import { OrderPriority } from "@/types";
import { calculateDistance, formatDistance, estimateTravelTimeMinutes } from "@/lib/distance";
import { formatPKR } from "@/lib/utils";
import { toast } from "sonner";
import {
  MapPin,
  Package,
  User,
  Phone,
  FileText,
  Navigation,
  ArrowRight,
  Calculator,
  Loader2,
  Sparkles,
  Flame,
  AlertTriangle,
  Minus,
} from "lucide-react";
import { GooglePlaceSearchInput } from "@/components/maps/google-place-search-input";
import { GoogleMapTracker } from "@/components/maps/google-map-tracker";
import { getGoogleDrivingDistance } from "@/lib/google-maps";

export function CreateOrderForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Locations state
  const [pickupPreset, setPickupPreset] = useState(PAKISTAN_LOCATIONS[0].id); // NED University
  const [deliveryPreset, setDeliveryPreset] = useState(PAKISTAN_LOCATIONS[1].id); // Saddar

  const [pickupAddress, setPickupAddress] = useState(PAKISTAN_LOCATIONS[0].address);
  const [pickupCoords, setPickupCoords] = useState({
    latitude: PAKISTAN_LOCATIONS[0].latitude,
    longitude: PAKISTAN_LOCATIONS[0].longitude,
  });

  const [deliveryAddress, setDeliveryAddress] = useState(PAKISTAN_LOCATIONS[1].address);
  const [deliveryCoords, setDeliveryCoords] = useState({
    latitude: PAKISTAN_LOCATIONS[1].latitude,
    longitude: PAKISTAN_LOCATIONS[1].longitude,
  });

  // Package & Recipient state
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("+92 3");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageWeight, setPackageWeight] = useState("1.0");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("normal");

  // Location selector change handlers
  const handlePickupChange = (presetId: string) => {
    setPickupPreset(presetId);
    const loc = PAKISTAN_LOCATIONS.find((l) => l.id === presetId);
    if (loc) {
      setPickupAddress(loc.address);
      setPickupCoords({ latitude: loc.latitude, longitude: loc.longitude });
    }
  };

  const handleDeliveryChange = (presetId: string) => {
    setDeliveryPreset(presetId);
    const loc = PAKISTAN_LOCATIONS.find((l) => l.id === presetId);
    if (loc) {
      setDeliveryAddress(loc.address);
      setDeliveryCoords({ latitude: loc.latitude, longitude: loc.longitude });
    }
  };

  // Browser Geolocation for Pickup
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const handleDetectCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Browser geolocation is not supported on this device.");
      return;
    }
    setFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFetchingGeo(false);
        const { latitude, longitude } = position.coords;
        setPickupCoords({ latitude, longitude });
        setPickupAddress(`Current GPS Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setPickupPreset("custom");
        toast.success("Detected current GPS location for pickup!");
      },
      (error) => {
        setFetchingGeo(false);
        toast.error(`Geolocation permission denied: ${error.message}. Please search an address or pick a hub.`);
      },
      { timeout: 10000 }
    );
  };

  // Live distance and pricing calculation
  const [googleDistance, setGoogleDistance] = useState<number | null>(null);
  const [googleDuration, setGoogleDuration] = useState<string | null>(null);

  useEffect(() => {
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
  }, [
    pickupCoords.latitude,
    pickupCoords.longitude,
    deliveryCoords.latitude,
    deliveryCoords.longitude,
  ]);

  // Use real Google Maps driving road distance if available, otherwise high-precision Haversine
  const distanceKm =
    googleDistance ??
    calculateDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );

  const estimatedMinutes =
    googleDuration ?? `~${estimateTravelTimeMinutes(distanceKm)} mins`;
  const weightNum = parseFloat(packageWeight) || 1;
  // Courier Rate: Base PKR 150 + 35 PKR/km + 25 PKR/kg + priority surcharge
  const prioritySurcharge = PRIORITY_CONFIG[priority].surchargePKR;
  const estimatedPrice = Math.round(150 + distanceKm * 35 + weightNum * 25 + prioritySurcharge);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a delivery request.");
      router.push("/login");
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
        price: estimatedPrice,
        estimatedDeliveryTime: estimatedMinutes,
      });

      toast.success(`Courier Order #${created.id} created successfully! Searching for riders...`);
      router.push(`/customer/orders/${created.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setRecipientName("Muhammad Farhan");
    setRecipientPhone("+92 321 4455667");
    setPackageDescription("Important Academic Project Files & Arduino Hardware Kit");
    setPackageWeight("1.5");
    setDeliveryInstructions("Please ring bell upon arrival at entrance gate.");
    toast.info("Prefilled sample delivery details!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Dispatch Courier Delivery
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pick any pickup & delivery address in Pakistan. Fare is calculated from real distance.
          </p>
        </div>
        <button
          type="button"
          onClick={handleQuickFill}
          className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Quick Fill Sample
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Pickup Location (Origin)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={fetchingGeo}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {fetchingGeo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Use GPS Geolocation
              </button>
            </div>

            <GooglePlaceSearchInput
              id="pickup-address"
              label="Pickup Location (Google Places Autocomplete)"
              value={pickupAddress}
              coords={pickupCoords}
              onChange={(addr, coords) => {
                setPickupAddress(addr);
                setPickupCoords(coords);
              }}
              placeholder="Search any address in Pakistan or click Hubs..."
              iconType="pickup"
            />
          </div>

          {/* Delivery Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                B
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Delivery Destination
              </h3>
            </div>

            <GooglePlaceSearchInput
              id="delivery-address"
              label="Delivery Destination (Google Places Autocomplete)"
              value={deliveryAddress}
              coords={deliveryCoords}
              onChange={(addr, coords) => {
                setDeliveryAddress(addr);
                setDeliveryCoords(coords);
              }}
              placeholder="Search destination street / area or click Hubs..."
              iconType="delivery"
            />
          </div>

          {/* Day 2: Delivery Priority */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Delivery Priority
            </h3>
            <div role="radiogroup" aria-label="Delivery priority" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRIORITY_LEVELS.map((level) => {
                const cfg = PRIORITY_CONFIG[level];
                const Icon = level === "urgent" ? Flame : level === "high" ? AlertTriangle : Minus;
                const selected = priority === level;
                const selectedStyle =
                  level === "urgent"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-500/30"
                    : level === "high"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-2 ring-orange-500/30"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30";
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPriority(level)}
                    className={`text-left p-3 rounded-xl border transition ${
                      selected
                        ? selectedStyle
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" /> {cfg.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {cfg.surchargePKR ? `+PKR ${cfg.surchargePKR}` : "No extra fee"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{cfg.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient & Package Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" /> Package & Recipient Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Farhan Ali"
                    required
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    required
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Package Description *
                </label>
                <input
                  type="text"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="e.g. Electronics, Medical Reports, Documents"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="30"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Handle with care, call when at guard gate, fragile parcel"
                rows={2}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Route & Price Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-20 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Route & Fare Estimation
            </h3>

            {/* Distance calculation metrics */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {googleDistance ? "Google Road Distance:" : "Straight-line Distance:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatDistance(distanceKm)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimated Transit Time:</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {estimatedMinutes}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Base Fare + Distance:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  PKR 150 + {Math.round(distanceKm * 35)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Weight Surcharge:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  PKR {Math.round(weightNum * 25)}
                </span>
              </div>
              {prioritySurcharge > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{PRIORITY_CONFIG[priority].label} Priority:</span>
                  <span className="text-slate-700 dark:text-slate-300">PKR {prioritySurcharge}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Total Delivery Fare:
                </span>
                <span className="font-extrabold text-lg text-blue-600 dark:text-blue-400">
                  {formatPKR(estimatedPrice)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>✓ Instant rider broadcast upon submission</p>
              <p>✓ Real-time GPS status updates</p>
              <p>✓ Secure one-to-one courier chat</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#142B49] via-[#2563EB] to-[#0D9488] hover:opacity-95 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Delivery Request...
                </>
              ) : (
                <>
                  <span>Request Delivery Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Real-time Google Maps Route Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Live Google Maps Route
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                Dynamic Coordinates
              </span>
            </div>
            <GoogleMapTracker
              pickupLocation={pickupCoords}
              pickupAddress={pickupAddress}
              deliveryLocation={deliveryCoords}
              deliveryAddress={deliveryAddress}
              status="pending"
              height="260px"
              interactive={true}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
