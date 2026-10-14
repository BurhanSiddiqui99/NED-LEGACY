"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["rider", "admin"]}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
