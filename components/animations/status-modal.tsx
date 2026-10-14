"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ParcelScene, ParcelSceneVariant } from "./parcel-scenes";

interface ModalAction {
  label: string;
  onClick: () => void;
}

export interface StatusModalProps {
  open: boolean;
  variant: ParcelSceneVariant;
  title: string;
  message?: string;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  onClose: () => void;
}

const ACCENT: Record<ParcelSceneVariant, string> = {
  packing: "from-emerald-500/20 via-teal-500/10",
  burst: "from-red-500/20 via-rose-500/10",
  searching: "from-blue-500/20 via-sky-500/10",
  pickup: "from-purple-500/20 via-indigo-500/10",
  transit: "from-teal-500/20 via-blue-500/10",
  delivered: "from-emerald-500/25 via-lime-500/10",
};

/** Animated feedback dialog used for order lifecycle moments (created, failed, accepted, delivered...). */
export function StatusModal({
  open,
  variant,
  title,
  message,
  primaryAction,
  secondaryAction,
  onClose,
}: StatusModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    primaryRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-status-title"
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className={`bg-gradient-to-b ${ACCENT[variant]} to-transparent pt-6 pb-2 flex justify-center`}>
          {/* key forces the scene to replay when the variant changes */}
          <ParcelScene key={variant} variant={variant} size={230} />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pb-6 text-center space-y-2">
          <h3 id="lp-status-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {message && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>}

          {(primaryAction || secondaryAction) && (
            <div className="pt-3 grid gap-2">
              {primaryAction && (
                <button
                  ref={primaryRef}
                  onClick={primaryAction.onClick}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition ${
                    variant === "burst"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                      : "bg-gradient-to-r from-[#027A48] via-[#039855] to-[#12B76A] hover:opacity-95 shadow-blue-500/20"
                  }`}
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
