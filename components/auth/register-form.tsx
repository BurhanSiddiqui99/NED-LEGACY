"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  User,
  Bike,
  Mail,
  Lock,
  Phone,
  Car,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const { registerCustomer, registerRider } = useAuth();

  const [role, setRole] = useState<"customer" | "rider">("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+92 3");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API error banner
  const [apiError, setApiError] = useState<string | null>(null);

  // Rider specific fields
  const [vehicleType, setVehicleType] = useState("Motorcycle (Honda 70/125)");
  const [vehicleNumber, setVehicleNumber] = useState("KHI-");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      const msg = "Please fill in all required registration fields.";
      setApiError(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match. Please re-enter.";
      setApiError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setApiError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      if (role === "customer") {
        await registerCustomer({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: "customer",
        });
        router.push("/customer/dashboard");
      } else {
        if (!vehicleNumber.trim()) {
          const msg = "Vehicle registration number is required for riders.";
          setApiError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        await registerRider({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: "rider",
          vehicleType,
          vehicleNumber: vehicleNumber.trim(),
        });
        router.push("/rider/dashboard");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to register account. Please check your credentials.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Picker Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setRole("customer");
            setApiError(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            role === "customer"
              ? "bg-white dark:bg-slate-900 text-[#142B49] dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4 text-blue-500" />
          <span>I am a Customer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("rider");
            setApiError(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            role === "rider"
              ? "bg-white dark:bg-slate-900 text-[#142B49] dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Bike className="w-4 h-4 text-amber-500" />
          <span>I am a Delivery Rider</span>
        </button>
      </div>

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-3 text-rose-800 dark:text-rose-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block text-rose-900 dark:text-rose-100">
                Registration Failed
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (apiError) setApiError(null);
              }}
              placeholder="e.g. Asad Qureshi"
              required
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (apiError) setApiError(null);
                }}
                placeholder="+92 300 1234567"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Rider Specific Fields */}
        {role === "rider" && (
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Delivery Partner Vehicle Registration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Honda CD 70 Motorcycle">Honda CD 70 Motorcycle</option>
                  <option value="Honda CG 125 Motorcycle">Honda CG 125 Motorcycle</option>
                  <option value="Suzuki GS 150 Motorcycle">Suzuki GS 150 Motorcycle</option>
                  <option value="Electric Delivery Scooter">Electric Delivery Scooter</option>
                  <option value="Small Commercial Van">Small Commercial Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Plate / Reg Number *
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value);
                      if (apiError) setApiError(null);
                    }}
                    placeholder="e.g. KHI-KAZ-3490"
                    required
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password & Confirm Password with Show/Hide Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Create Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (apiError) setApiError(null);
                }}
                placeholder="Min 6 characters"
                required
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 transition"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (apiError) setApiError(null);
                }}
                placeholder="Repeat password"
                required
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 transition"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              Creating {role === "rider" ? "Rider" : "Customer"} Account...
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-slate-500">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
