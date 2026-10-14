"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!email || !password) {
      const msg = "Please provide both email and password.";
      setApiError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      router.push(`/${loggedUser.role}/dashboard`);
    } catch (err: any) {
      setApiError(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-3 text-rose-800 dark:text-rose-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block text-rose-900 dark:text-rose-100">
                Sign In Error
              </span>
              <span>{apiError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-rose-500 transition shrink-0"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Real Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (apiError) setApiError(null);
              }}
              placeholder="name@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#142B49] hover:bg-[#0f2138] text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-1 text-xs text-slate-500">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/register"
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Register as Customer or Rider
        </Link>
      </div>
    </div>
  );
}
