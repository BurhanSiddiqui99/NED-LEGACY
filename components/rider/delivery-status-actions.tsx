"use client";

import React, { useEffect, useRef, useState } from "react";
import { Order, OrderStatus, VerificationParty } from "@/types";
import { ordersService } from "@/services/orders.service";
import { verificationService } from "@/services/verification.service";
import { useAuth } from "@/contexts/auth-context";
import { StatusModal } from "@/components/animations/status-modal";
import { ParcelSceneVariant } from "@/components/animations/parcel-scenes";
import { CHECKPOINT_LABELS, getDeliveryType, getNextTransition, getWarehouse } from "@/lib/logistics";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Warehouse as WarehouseIcon,
  Clock,
} from "lucide-react";

interface DeliveryStatusActionsProps {
  order: Order;
  riderUid: string;
  onStatusUpdated?: (updatedOrder: Order) => void;
}

const PARTY_LABEL: Record<VerificationParty, string> = {
  customer: "Customer",
  admin: "Warehouse admin",
};

const MOMENTS: Partial<Record<OrderStatus, { variant: ParcelSceneVariant; title: string; message: string }>> = {
  picked_up: { variant: "pickup", title: "Parcel picked up", message: "Verified by the customer. Box secured on the bike." },
  in_transit: { variant: "transit", title: "On the way!", message: "The customer can follow you live on the map. Ride safe." },
  at_origin_warehouse: {
    variant: "packing",
    title: "Handed in at the warehouse",
    message: "Customer and admin both verified. Your part of this delivery is complete. Great job!",
  },
  out_for_delivery: { variant: "pickup", title: "Collected from warehouse", message: "Admin verified the handover. Head to the drop-off." },
  delivered: { variant: "delivered", title: "Delivered! 🎉", message: "The customer verified the delivery with their code." },
};

/** What the rider sees while the next step belongs to the admin or the warehouse. */
function waitingMessage(order: Order): string | null {
  const dest = getWarehouse(order.destinationWarehouseId);
  switch (order.status) {
    case "at_origin_warehouse":
      return `Parcel is at the ${order.originCity} warehouse. The admin will dispatch it to ${order.destinationCity}.`;
    case "linehaul":
      return `Parcel is travelling to the ${dest?.name || "destination warehouse"}.`;
    case "at_destination_warehouse":
      return "Waiting for a last-mile rider to claim it from the nearby feed.";
    default:
      return null;
  }
}

export function DeliveryStatusActions({ order, riderUid, onStatusUpdated }: DeliveryStatusActionsProps) {
  const { user, role } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [demoCodes, setDemoCodes] = useState<Partial<Record<VerificationParty, string>>>({});
  // Seconds left before each party's code can be resent (server allows one send per 30 s)
  const [resendIn, setResendIn] = useState<Partial<Record<VerificationParty, number>>>({});
  const cooling = Object.values(resendIn).some((n) => (n || 0) > 0);
  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(
      () =>
        setResendIn((r) =>
          Object.fromEntries(Object.entries(r).map(([k, n]) => [k, Math.max(0, (n || 0) - 1)]))
        ),
      1000
    );
    return () => clearInterval(id);
  }, [cooling]);
  const [moment, setMoment] = useState<{ variant: ParcelSceneVariant; title: string; message: string } | null>(null);

  // Celebrate every step change, including ones completed by the customer / admin entering the OTP
  const prevStatusRef = useRef(order.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = order.status;
    if (prev === order.status) return;
    const m = MOMENTS[order.status];
    if (!m) return;
    if (order.status === "delivered") {
      import("canvas-confetti").then(({ default: confetti }) =>
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } })
      );
    }
    setMoment(m);
  }, [order.status]);

  const transition = getNextTransition(order);
  const isAssigned = order.riderId === riderUid;
  const wasOnOrder = order.riderIds?.includes(riderUid);

  const modal = (
    <StatusModal
      open={!!moment}
      variant={moment?.variant || "transit"}
      title={moment?.title || ""}
      message={moment?.message}
      primaryAction={{ label: "Continue", onClick: () => setMoment(null) }}
      onClose={() => setMoment(null)}
    />
  );

  if (order.status === "delivered") {
    return (
      <>
        {modal}
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4" />
          <span>Delivery completed and verified</span>
        </div>
      </>
    );
  }

  if (!isAssigned || !transition || transition.actor !== "rider") {
    const waiting = waitingMessage(order);
    return (
      <>
        {modal}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
          {waiting ? <WarehouseIcon className="w-4 h-4 shrink-0 text-indigo-500" /> : <Clock className="w-4 h-4 shrink-0" />}
          <span>
            {waiting ||
              (wasOnOrder ? "Your leg of this delivery is complete." : "You are not assigned to this delivery.")}
          </span>
        </div>
      </>
    );
  }

  const parties = transition.parties || [];
  const checkpoint = transition.checkpoint;
  const record = checkpoint ? order.verifications?.[checkpoint] : undefined;
  const allVerified = parties.every((p) => record?.verifiedBy?.[p]);

  // The code is emailed to the rider; the customer / admin asks for it and enters it on their side
  const sendCode = async (party: VerificationParty) => {
    if (!checkpoint || !user) return;
    setBusy(`send-${party}`);
    try {
      const { sentTo, demoCode } = await verificationService.sendCode(order, checkpoint, party, user.email);
      setResendIn((r) => ({ ...r, [party]: 30 }));
      if (demoCode) {
        setDemoCodes((d) => ({ ...d, [party]: demoCode }));
        toast.warning(`Email not configured. Demo code for ${PARTY_LABEL[party].toLowerCase()}: ${demoCode}`, {
          duration: 15000,
        });
      } else {
        toast.success(`Code sent to your email (${sentTo}). Read it to the ${PARTY_LABEL[party].toLowerCase()}.`);
      }
    } catch (err: any) {
      // Already sent moments ago (e.g. a double tap): show the countdown instead of an error
      if (/wait 30 seconds/i.test(err.message)) {
        setResendIn((r) => ({ ...r, [party]: 30 }));
        toast.info("Code already sent. Check your email; you can resend in 30 seconds.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const complete = async () => {
    if (!user) return;
    setBusy("advance");
    try {
      // The status listener above shows the matching animation
      const updated = await ordersService.advance(order.id, transition.to, { uid: user.uid, role, name: user.fullName });
      onStatusUpdated?.(updated);
    } catch (err: any) {
      setMoment({ variant: "burst", title: "Step failed", message: err.message || "Failed to update status" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
      {modal}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Next: {transition.label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
          {getDeliveryType(order) === "intercity" ? `Intercity · ${order.originCity} → ${order.destinationCity}` : "Within city"}
        </span>
      </div>

      {checkpoint && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {CHECKPOINT_LABELS[checkpoint]}: get a code on <strong>your email</strong> and read it to the{" "}
              {parties.map((p) => PARTY_LABEL[p].toLowerCase()).join(" and ")}. They enter it in their app to verify.
            </span>
          </p>

          {parties.map((party) => {
            const challenge = record?.challenges?.[party];
            const verifiedAt = record?.verifiedBy?.[party];
            return (
              <div
                key={party}
                className={`p-3 rounded-xl border space-y-2 ${
                  verifiedAt
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Code for {PARTY_LABEL[party].toLowerCase()}</span>
                  {verifiedAt ? (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified {formatRelativeTime(verifiedAt)}
                    </span>
                  ) : challenge ? (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Waiting for {PARTY_LABEL[party].toLowerCase()} to enter it
                    </span>
                  ) : null}
                </div>

                {!verifiedAt && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendCode(party)}
                      disabled={!!busy || (resendIn[party] || 0) > 0}
                      className="py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {busy === `send-${party}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      {(resendIn[party] || 0) > 0
                        ? `Resend in ${resendIn[party]}s`
                        : challenge
                        ? "Resend to my email"
                        : "Email me the code"}
                    </button>
                    {challenge && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" /> Sent to {challenge.sentTo}
                      </span>
                    )}
                  </div>
                )}
                {!verifiedAt && demoCodes[party] && (
                  <p className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                    Demo mode (no SMTP): code is {demoCodes[party]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {checkpoint ? (
        // OTP steps finish by themselves the moment the last code is entered on the other side
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
          {allVerified
            ? "Verified. Updating…"
            : `This step completes automatically once the ${parties
                .map((p) => PARTY_LABEL[p].toLowerCase())
                .join(" and ")} enter${parties.length > 1 ? "" : "s"} your code.`}
        </p>
      ) : (
        <button
          onClick={complete}
          disabled={!!busy}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#027A48] via-[#039855] to-[#12B76A] hover:opacity-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
        >
          {busy === "advance" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>{transition.label}</span>
        </button>
      )}
    </div>
  );
}
