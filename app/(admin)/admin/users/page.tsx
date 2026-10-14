"use client";

import React, { useEffect, useState } from "react";
import { usersService } from "@/services/users.service";
import { AppUser } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Users, Search, UserCheck, UserX, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = usersService.subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const customers = users.filter((u) => u.role === "customer");

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term)
    );
  });

  const handleToggleStatus = async (user: AppUser) => {
    try {
      await usersService.toggleActive(user.uid, user.isActive);
      toast.success(
        `Customer ${user.fullName} account ${user.isActive ? "deactivated" : "activated"} successfully.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Customer Accounts Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered senders, check verification statuses, and control access.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Registered Email</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {customer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span>{customer.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {customer.phone || "+92 300 0000000"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {customer.email}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(customer.createdAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          customer.isActive !== false
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                        }`}
                      >
                        {customer.isActive !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          customer.isActive !== false
                            ? "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {customer.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
