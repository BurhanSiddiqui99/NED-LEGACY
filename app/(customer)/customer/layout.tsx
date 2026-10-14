"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["customer", "admin"]}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
