"use client";

import React from "react";
import { Order, VerificationCheckpoint, VerificationParty } from "@/types";
import { CHECKPOINT_LABELS, getDeliveryType } from "@/lib/logistics";
import { formatRelativeTime } from "@/lib/utils";
import { OtpEntry } from "./otp-entry";
import { CheckCircle2, Mail, ShieldCheck, Circle, BellRing } from "lucide-react";

const PLAN: Record<"intracity" | "intercity", { checkpoint: VerificationCheckpoint; parties: VerificationParty[] }[]> = {
  intracity: [
    { checkpoint: "pickup", parties: ["customer"] },
    { checkpoint: "delivery", parties: ["customer"] },
  ],
  intercity: [
    { checkpoint: "pickup", parties: ["customer"] },
    { checkpoint: "origin_warehouse", parties: ["customer", "admin"] },
    { checkpoint: "warehouse_handover", parties: ["admin"] },
    { checkpoint: "delivery", parties: ["customer"] },
  ],
};

const PARTY_NAME: Record<VerificationParty, string> = { customer: "Customer", admin: "Admin" };

/**
 * Every OTP checkpoint of the order. The rider receives the code by email; when it is the
 * viewer's turn to verify, an input appears here to type the code the rider reads out.
 */
export function VerificationStatusCard({ order, viewer }: { order: Order; viewer: VerificationParty }) {
  const plan = PLAN[getDeliveryType(order)];
  const waitingOnMe = plan.some(
    ({ checkpoint, parties }) =>
      parties.includes(viewer) &&
      order.verifications?.[checkpoint]?.challenges?.[viewer] &&
      !order.verifications?.[checkpoint]?.verifiedBy?.[viewer]
  );

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm space-y-3 ${
        waitingOnMe ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" /> OTP Verifications
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        At each handover the rider receives a 6-digit code on their email. Ask the rider for it and enter it here only when
        the step really happens.
      </p>
      <ul className="space-y-2">
        {plan.map(({ checkpoint, parties }) => {
          const record = order.verifications?.[checkpoint];
          const done = Boolean(record?.completedAt) || parties.every((p) => record?.verifiedBy?.[p]);
          const myTurn =
            parties.includes(viewer) && !!record?.challenges?.[viewer] && !record?.verifiedBy?.[viewer] && !record?.completedAt;
          return (
            <li
              key={checkpoint}
              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                done
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                  : myTurn
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
                  {CHECKPOINT_LABELS[checkpoint]}
                </span>
                {done && record?.completedAt && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">{formatRelativeTime(record.completedAt)}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pl-5">
                {parties.map((p) => {
                  const verified = record?.verifiedBy?.[p];
                  const sent = record?.challenges?.[p];
                  return (
                    <span
                      key={p}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        verified
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                          : sent
                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                          : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                      }`}
                    >
                      {verified ? <CheckCircle2 className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                      {PARTY_NAME[p]}
                      {verified ? " verified" : sent ? ": rider has the code" : ": not started"}
                    </span>
                  );
                })}
              </div>

              {myTurn && (
                <div className="pl-5 space-y-1">
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <BellRing className="w-3 h-3" /> Ask {order.riderName || "the rider"} for the code and enter it:
                  </p>
                  <OtpEntry order={order} checkpoint={checkpoint} party={viewer} compact />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
