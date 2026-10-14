"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role === "customer") {
        router.replace("/customer/dashboard");
      } else if (role === "rider") {
        router.replace("/rider/dashboard");
      } else if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-[#12B76A]" />
      <span className="text-xs text-slate-400 mt-3 font-medium">
        Redirecting to your authorized dashboard...
      </span>
    </div>
  );
}
