"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  Radio,
  Package,
  Bike,
  ShieldCheck,
  Navigation,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  LogOut,
  PackagePlus,
  MessageSquare,
  Flame,
  Warehouse,
  BellRing,
  Star,
  Search,
  Truck,
} from "lucide-react";
import { ParcelCube3D } from "@/components/animations/parcel-cube-3d";
import { ThemeToggle } from "@/components/layouts/theme-toggle";
import { WAREHOUSES } from "@/lib/logistics";

const STEPS = [
  {
    icon: Search,
    title: "Enter pickup & drop-off",
    text: "Search any street, shop or landmark. We show the route and the exact fare before you book.",
  },
  {
    icon: Bike,
    title: "A nearby rider accepts",
    text: "Your request goes to riders in your city instantly. The closest one picks it up.",
  },
  {
    icon: CheckCircle2,
    title: "Track it to the door",
    text: "Follow your parcel live on the map, chat with the rider and confirm delivery with a code.",
  },
];

const FEATURES = [
  { icon: Navigation, title: "Live map tracking", text: "See your rider move on the map in real time, with a live ETA.", tone: "from-green-500 to-emerald-700" },
  { icon: MessageSquare, title: "Chat with your rider", text: "Message the rider directly, no phone numbers shared.", tone: "from-orange-400 to-orange-600" },
  { icon: Flame, title: "Urgent delivery", text: "Mark a parcel High or Urgent and it jumps to the top of the queue.", tone: "from-orange-400 to-red-500" },
  { icon: ShieldCheck, title: "Verified handovers", text: "Pickup and delivery are confirmed with one-time codes.", tone: "from-emerald-400 to-green-600" },
  { icon: Warehouse, title: "City-to-city shipping", text: "Intercity parcels move through our city warehouses, tracked at every step.", tone: "from-indigo-400 to-indigo-600" },
  { icon: BellRing, title: "Instant updates", text: "Get notified the moment your parcel is accepted, picked up or delivered.", tone: "from-lime-400 to-green-600" },
];

export default function HomePage() {
  const { user, role, logout } = useAuth();
  const dashboardHref = user && role ? `/${role}/dashboard` : "/login";

  return (
    <div className="relative min-h-screen lp-app-bg text-slate-900 dark:text-slate-100 flex flex-col overflow-x-hidden">
      {/* Ambient animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60rem] overflow-hidden">
        <div className="absolute inset-0 lp-grid-bg" />
        <div className="lp-blob w-[30rem] h-[30rem] bg-blue-500 -top-48 -left-40" />
        <div className="lp-blob w-[26rem] h-[26rem] bg-pink-500 top-24 -right-40" style={{ animationDelay: "-6s" }} />
        <div className="lp-blob w-[22rem] h-[22rem] bg-violet-500 top-[34rem] left-1/3" style={{ animationDelay: "-12s" }} />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl lp-brand-gradient flex items-center justify-center shadow-glow group-hover:scale-105 transition">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">LogiPulse</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#how" className="px-3 py-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition">
              How it works
            </a>
            <a href="#features" className="px-3 py-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition">
              Features
            </a>
            <a href="#portals" className="px-3 py-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition">
              For riders & business
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="px-4 py-2 lp-brand-gradient text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-glow hover:opacity-95 whitespace-nowrap"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-2 lp-brand-gradient text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-glow hover:opacity-95 flex items-center gap-1 whitespace-nowrap"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:block" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left lp-page-enter">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              Delivering in {WAREHOUSES.length} cities across Pakistan
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Send parcels across Pakistan,{" "}
              <span className="lp-brand-text">tracked live.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Book a courier in seconds, see the fare upfront, and follow your rider on the map until your parcel is
              safely delivered.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href={user ? (role === "customer" ? "/customer/create-order" : dashboardHref) : "/register"}
                className="w-full sm:w-auto px-6 py-3.5 lp-brand-gradient text-white rounded-2xl text-sm font-bold shadow-glow hover:opacity-95 hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" />
                {user ? (role === "customer" ? "Send a Parcel" : "Open Dashboard") : "Send a Parcel Now"}
              </Link>
              <Link
                href={user ? dashboardHref : "/login"}
                className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {user ? "Track My Orders" : "Sign In"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              {[
                ["PKR 250", "Same-city fare"],
                ["Live", "GPS tracking"],
                ["24/7", "Rider network"],
              ].map(([value, label]) => (
                <div key={label} className="text-center lg:text-left">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{value}</dd>
                  <dd className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual: live tracking preview */}
          <div className="relative mx-auto w-full max-w-md lp-page-enter" style={{ animationDelay: "0.1s" }}>
            <div className="absolute -inset-6 lp-brand-gradient opacity-20 dark:opacity-30 blur-3xl rounded-[3rem]" aria-hidden="true" />
            <div className="relative rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order #LP-2048</p>
                  <p className="font-bold text-slate-900 dark:text-white">Out for delivery</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>

              {/* Stylised route */}
              <div className="relative mt-5 h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-violet-50 to-pink-50 dark:from-blue-950/60 dark:via-slate-900 dark:to-pink-950/40 border border-slate-100 dark:border-slate-800">
                <div className="absolute inset-0 lp-grid-bg opacity-70" aria-hidden="true" />
                <svg viewBox="0 0 320 176" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="lp-route" x1="0" x2="1">
                      <stop offset="0%" stopColor="#039855" />
                      <stop offset="60%" stopColor="#12B76A" />
                      <stop offset="100%" stopColor="#FB923C" />
                    </linearGradient>
                  </defs>
                  <path d="M40 140 C 100 140, 90 60, 160 70 S 240 30, 280 40" fill="none" stroke="url(#lp-route)" strokeWidth="5" strokeLinecap="round" />
                  <path d="M40 140 C 100 140, 90 60, 160 70 S 240 30, 280 40" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 8" strokeLinecap="round" />
                  <circle cx="40" cy="140" r="9" fill="#039855" stroke="white" strokeWidth="3" />
                  <circle cx="280" cy="40" r="9" fill="#FB923C" stroke="white" strokeWidth="3" />
                </svg>
                <div className="absolute left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 lp-float">
                  <span className="flex w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg items-center justify-center ring-4 ring-violet-500/20">
                    <Bike className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-7 h-7 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold">Pickup</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">Clifton Block 5, Karachi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-7 h-7 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold">Drop-off</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">Gulshan-e-Iqbal, Karachi</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full lp-brand-gradient text-white text-xs font-bold flex items-center justify-center">AR</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Ali Raza</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9 · Honda CD-70
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-semibold">Arriving in</p>
                  <p className="text-lg font-extrabold lp-brand-text leading-tight">12 min</p>
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <div className="hidden sm:block absolute -left-10 top-24 lp-float" style={{ animationDelay: "-1s" }}>
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg px-3 py-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Urgent priority</span>
              </div>
            </div>
            <div className="hidden sm:block absolute -right-8 -bottom-6 lp-float" style={{ animationDelay: "-2s" }}>
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg pl-2 pr-3 py-2 flex items-center gap-2">
                <ParcelCube3D size={22} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Delivered safely ✓</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cities strip */}
        <section className="border-y border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/40 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Now serving</span>
            {WAREHOUSES.map((w) => (
              <span key={w.id} className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet-500" />
                {w.city}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider lp-brand-text">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Delivered in three simple steps</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">No calls, no haggling. Just book, track and receive.</p>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="lp-lift relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg"
              >
                <span className="absolute top-5 right-6 text-5xl font-extrabold text-slate-100 dark:text-slate-800 select-none">
                  {i + 1}
                </span>
                <span className="relative w-12 h-12 rounded-2xl lp-brand-gradient text-white flex items-center justify-center shadow-glow">
                  <step.icon className="w-6 h-6" />
                </span>
                <h3 className="relative mt-5 font-bold text-lg text-slate-900 dark:text-white">{step.title}</h3>
                <p className="relative mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider lp-brand-text">Why LogiPulse</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Everything you need for stress-free delivery</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="lp-lift group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg"
              >
                <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.tone} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Role portals */}
        <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider lp-brand-text">One platform, three apps</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Built for everyone in the delivery</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Package,
                title: "Customers",
                text: "Book deliveries anywhere in Pakistan, see the fare upfront and track every step live.",
                href: "/customer/dashboard",
                cta: "Send a parcel",
                tone: "from-green-500 to-emerald-700",
              },
              {
                icon: Bike,
                title: "Riders",
                text: "See nearby jobs sorted by distance, accept with one tap and earn on your own schedule.",
                href: "/rider/dashboard",
                cta: "Start riding",
                tone: "from-amber-400 to-orange-500",
              },
              {
                icon: ShieldCheck,
                title: "Operations",
                text: "Monitor every order, rider and warehouse in real time with analytics and alerts.",
                href: "/admin/dashboard",
                cta: "Open control center",
                tone: "from-indigo-400 to-indigo-600",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="lp-lift group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg flex flex-col"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${p.tone} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`}
                />
                <span className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${p.tone} text-white flex items-center justify-center shadow-md`}>
                  <p.icon className="w-6 h-6" />
                </span>
                <h3 className="relative mt-5 font-bold text-lg text-slate-900 dark:text-white">{p.title}</h3>
                <p className="relative mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{p.text}</p>
                <Link
                  href={p.href}
                  className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all"
                >
                  {p.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="relative overflow-hidden rounded-[2rem] lp-brand-gradient px-6 py-12 sm:px-12 text-center text-white shadow-xl">
            <div aria-hidden="true" className="absolute inset-0 opacity-30 lp-grid-bg" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <Truck className="relative w-10 h-10 mx-auto opacity-90" />
            <h2 className="relative mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">Ready to send your first parcel?</h2>
            <p className="relative mt-3 text-white/80 max-w-xl mx-auto">
              Create a free account and book a delivery in under a minute.
            </p>
            <div className="relative mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user ? dashboardHref : "/register"}
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-violet-700 rounded-2xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {user ? "Go to Dashboard" : "Create Free Account"}
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl text-sm font-bold transition"
                >
                  I already have an account
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl lp-brand-gradient flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white">LogiPulse</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> © 2026 LogiPulse · Fast, tracked deliveries across Pakistan
          </p>
        </div>
      </footer>
    </div>
  );
}
