"use client";

import { ChatButton } from "@/components/chat/chat-button";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PriorityBadge } from "@/components/orders/priority-badge";
import { CHECKPOINT_LABELS, getActiveLeg, getNextTransition } from "@/lib/logistics";
import { OtpEntry } from "@/components/orders/otp-entry";
import { OrderStatusHero } from "@/components/orders/order-status-hero";
import { VerificationStatusCard } from "@/components/orders/verification-status-card";
import { StatusModal } from "@/components/animations/status-modal";
import { ParcelSceneVariant } from "@/components/animations/parcel-scenes";
import { OrderStatus } from "@/types";
import { getOrderPriority, isTrackable } from "@/constants";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { toast } from "sonner";
import {
  MapPin,
  ArrowRight,
  Package,
  Bike,
  User,
  Phone,
  MessageSquare,
  Clock,
  ArrowLeft,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Google Maps is the heaviest part of this page; load it after the order details render
const GoogleMapTracker = dynamic(
  () => import("@/components/maps/google-map-tracker").then((m) => m.GoogleMapTracker),
  { ssr: false, loading: () => <div className="h-[360px] rounded-3xl lp-skeleton" /> }
);

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [moment, setMoment] = useState<{ variant: ParcelSceneVariant; title: string; message: string } | null>(null);
  const lastStatusRef = useRef<OrderStatus | null>(null);

  useEffect(() => {
    if (!orderId) return;
    lastStatusRef.current = null;
    const unsub = ordersService.subscribeById(orderId, (data) => {
      setOrder(data);
      setLoading(false);

      // Celebrate live status changes pushed by the rider (not the status we loaded with)
      const prev = lastStatusRef.current;
      lastStatusRef.current = data?.status || null;
      if (!data || !prev || prev === data.status) return;
      const rider = data.riderName || "Your rider";
      const moments: Partial<Record<OrderStatus, { variant: ParcelSceneVariant; title: string; message: string }>> = {
        accepted: { variant: "pickup", title: "Rider assigned!", message: `${rider} accepted your order and is heading to pickup.` },
        picked_up: { variant: "pickup", title: "Parcel picked up", message: `${rider} has collected your parcel.` },
        in_transit: { variant: "transit", title: "On the way!", message: `${rider} is on the move with your parcel. Follow along on the live map.` },
        at_origin_warehouse: { variant: "packing", title: "Received at the warehouse", message: `Your parcel is safely at the ${data.originCity} warehouse.` },
        linehaul: { variant: "transit", title: "Travelling between cities", message: `${data.originCity} → ${data.destinationCity}.` },
        at_destination_warehouse: { variant: "searching", title: `Arrived in ${data.destinationCity}`, message: "Assigning a local rider for the final delivery." },
        last_mile_accepted: { variant: "pickup", title: "Delivery rider assigned", message: `${rider} will collect your parcel from the warehouse.` },
        out_for_delivery: { variant: "transit", title: "Out for delivery", message: `${rider} is on the way. Keep your delivery code ready.` },
        delivered: { variant: "delivered", title: "Delivered 🎉", message: "Your parcel was handed to the recipient." },
      };
      if (moments[data.status]) setMoment(moments[data.status]!);
    });
    return () => unsub();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order || !user) return;
    setCancelling(true);
    try {
      await ordersService.cancel(order.id, user.uid);
      setShowCancelModal(false);
      setMoment({ variant: "burst", title: "Request cancelled", message: "Your delivery request was removed from the rider feed." });
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs text-slate-400">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-white">Order Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No delivery request was found with reference #{orderId}.
        </p>
        <Link
          href="/customer/orders"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#039855] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
      </div>
    );
  }

  const tripDistance = calculateDistance(
    order.pickupLocation.latitude,
    order.pickupLocation.longitude,
    order.deliveryLocation.latitude,
    order.deliveryLocation.longitude
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto lp-page-enter">
      <StatusModal
        open={!!moment}
        variant={moment?.variant || "transit"}
        title={moment?.title || ""}
        message={moment?.message}
        primaryAction={{ label: "Got it", onClick: () => setMoment(null) }}
        onClose={() => setMoment(null)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customer/orders"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                #{order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
              <PriorityBadge priority={getOrderPriority(order)} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <ChatButton
            order={order}
            href={`/customer/messages/${order.id}`}
            label="Chat with Rider"
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          />

          {order.status === "pending" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="py-2 px-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 border border-red-200 dark:border-red-800"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Request</span>
            </button>
          )}
        </div>
      </div>

      <OrderStatusHero order={order} />

      {/* The rider has a code for the customer right now: put the input front and centre */}
      {(() => {
        const t = getNextTransition(order);
        const cp = t?.checkpoint;
        const waiting =
          cp && t?.parties?.includes("customer") && order.verifications?.[cp]?.challenges?.customer && !order.verifications?.[cp]?.verifiedBy?.customer;
        if (!waiting || !cp) return null;
        return (
          <div className="p-4 sm:p-5 rounded-3xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 space-y-2 animate-in fade-in duration-300">
            <p className="text-sm font-black text-amber-900 dark:text-amber-200">
              {order.riderName || "Your rider"} is here. Ask them for the OTP.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              The rider received a 6-digit code on their email. Enter it to confirm the {CHECKPOINT_LABELS[cp].toLowerCase()}.
            </p>
            <div className="max-w-sm">
              <OtpEntry order={order} checkpoint={cp} party="customer" />
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tracking timeline & Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Google Maps Radar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Live Google Maps Real-Time Telemetry
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Courier Radar
              </span>
            </div>
            <GoogleMapTracker
              pickupLocation={getActiveLeg(order).from}
              pickupAddress={getActiveLeg(order).fromLabel}
              deliveryLocation={getActiveLeg(order).to}
              deliveryAddress={getActiveLeg(order).toLabel}
              riderHeadingToStart={getActiveLeg(order).riderHeadingToStart}
              riderLocation={isTrackable(order) ? order.currentRiderLocation : null}
              riderUpdatedAt={order.riderLocationUpdatedAt}
              showTimeline
              riderName={order.riderName}
              status={order.status}
              height="360px"
              interactive={true}
            />
          </div>

          {/* Timeline Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Live Courier Tracking
            </h2>
            <OrderTimeline order={order} />
          </div>

          {/* Route Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Delivery Route Details
              </h2>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                {formatDistance(tripDistance)} Total Transit
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Pickup Location
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {order.pickupAddress}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Coordinates: {order.pickupLocation.latitude.toFixed(4)}, {order.pickupLocation.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Delivery Destination
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {order.deliveryAddress}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Coordinates: {order.deliveryLocation.latitude.toFixed(4)}, {order.deliveryLocation.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Rider & Package Specs */}
        <div className="space-y-6">
          <VerificationStatusCard order={order} viewer="customer" />
          {/* Assigned Rider Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Assigned Delivery Partner
            </h3>

            {order.riderId && order.riderName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#039855] to-[#12B76A] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {order.riderName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {order.riderVehicle || "Registered Fleet Partner"}
                    </p>
                  </div>
                </div>

                {order.riderPhone && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold">{order.riderPhone}</span>
                  </div>
                )}

                <ChatButton
                  order={order}
                  href={`/customer/messages/${order.id}`}
                  label="Open Direct Courier Chat"
                  iconClassName="w-3.5 h-3.5"
                  className="w-full py-2.5 px-3 bg-[#12B76A] hover:bg-[#039855] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  Looking for a nearby rider
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Your request is visible to nearby verified riders. You will be notified the moment one accepts.
                </p>
              </div>
            )}
          </div>

          {/* Package Details Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
              Package & Recipient
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Recipient Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.recipientName}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Recipient Phone</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.recipientPhone}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Description</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[160px] truncate">
                  {order.packageDescription}
                </span>
              </div>

              {order.packageWeight && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.packageWeight} kg
                  </span>
                </div>
              )}

              {order.deliveryInstructions && (
                <div className="pt-1.5">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Special Instructions</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                    {order.deliveryInstructions}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Total Delivery Fee</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {formatPKR(order.price || 350)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Cancel Delivery Request?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel Order #{order.id}? This will remove the request from the rider broadcast pool.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
