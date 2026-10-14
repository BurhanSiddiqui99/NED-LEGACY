"use client";

import React, { useState } from "react";
import { Order, VerificationCheckpoint, VerificationParty } from "@/types";
import { verificationService } from "@/services/verification.service";
import { useAuth } from "@/contexts/auth-context";
import { STATUS_CONFIG } from "@/constants";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

interface OtpEntryProps {
  order: Order;
  checkpoint: VerificationCheckpoint;
  party: VerificationParty;
  compact?: boolean;
}

/**
 * Where the customer or admin types the code the rider reads out to them.
 * If it was the last code the step needed, the step completes right away
 * (the order page plays the matching animation when the status changes).
 */
export function OtpEntry({ order, checkpoint, party, compact = false }: OtpEntryProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { completedStep } = await verificationService.confirmCode(order, checkpoint, party, code.trim(), user.uid);
      setCode("");
      if (completedStep) {
        if (completedStep === "delivered") {
          import("canvas-confetti").then(({ default: confetti }) =>
            confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } })
          );
        }
        toast.success(`Verified! Order #${order.id} is now ${STATUS_CONFIG[completedStep].label}.`);
      } else {
        toast.success("Code verified. Waiting for the other party's code.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`flex gap-2 ${compact ? "" : "pt-1"}`}>
      <div className="relative flex-1 min-w-0">
        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="Code from rider"
          aria-label="Verification code from rider"
          className="w-full pl-8 pr-2 py-2 rounded-lg text-sm font-mono tracking-[0.25em] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-1 shrink-0"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
      </button>
    </form>
  );
}
