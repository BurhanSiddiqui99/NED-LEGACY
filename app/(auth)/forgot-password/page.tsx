"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, ArrowLeft, Loader2, KeyRound, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const inputCls =
  "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const buttonCls =
  "w-full py-3 px-4 bg-[#039855] hover:bg-[#027A48] text-white font-bold rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50";

async function callResetApi(body: Record<string, string>) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null); // set once the code has been emailed
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const data = await callResetApi({ action: "send", email });
      setToken(data.token);
      toast.success("Code sent! Check your email (and spam folder).");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await callResetApi({ action: "reset", email, code, token: token!, password });
      toast.success("Password updated. Sign in with your new password.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#039855] via-[#027A48] to-[#022C1B] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/20">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        {!token ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset your password</h2>
              <p className="text-xs text-slate-500 mt-1">Enter your email and we&apos;ll send you a 6-digit code.</p>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                aria-label="Email address"
                required
                className={inputCls}
              />
            </div>
            <button type="submit" disabled={loading} className={buttonCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Sending code..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enter code & new password</h2>
              <p className="text-xs text-slate-500 mt-1">
                We emailed a code to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>. It expires in 15 minutes.
              </p>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                aria-label="Verification code"
                required
                className={`${inputCls} tracking-[0.3em] font-semibold`}
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                aria-label="New password"
                autoComplete="new-password"
                minLength={6}
                required
                className={inputCls}
              />
            </div>
            <button type="submit" disabled={loading || code.length !== 6} className={buttonCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Updating..." : "Reset password"}
            </button>
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={loading}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Didn&apos;t get it? Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
