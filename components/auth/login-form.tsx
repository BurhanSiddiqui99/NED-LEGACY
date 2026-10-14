"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DEMO_ACCOUNTS } from "@/constants";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Bike,
  User,
  ChevronDown,
  ChevronUp,
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
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      router.push(`/${loggedUser.role}/dashboard`);
    } catch (err: any) {
      // Handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setLoading(true);
    try {
      const loggedUser = await login(demo.email, demo.password);
      router.push(`/${loggedUser.role}/dashboard`);
    } catch (err: any) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Real Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
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

      {/* Optional Demo Accounts Accordion */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowDemoOptions(!showDemoOptions)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Quick Test Accounts (Optional)
          </span>
          {showDemoOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDemoOptions && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => handleQuickDemoLogin(d)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left transition shadow-sm hover:shadow group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                  {d.role === "customer" && <User className="w-3.5 h-3.5 text-blue-500" />}
                  {d.role === "rider" && <Bike className="w-3.5 h-3.5 text-amber-500" />}
                  {d.role === "admin" && <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />}
                  <span className="capitalize">{d.role}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {d.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
