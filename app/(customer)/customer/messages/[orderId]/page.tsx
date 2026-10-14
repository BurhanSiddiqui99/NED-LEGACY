"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { ChatWindow } from "@/components/chat/chat-window";
import { Loader2 } from "lucide-react";

export default function CustomerChatPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const unsub = ordersService.subscribeById(orderId, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs text-slate-400">Loading conversation...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Order not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ChatWindow
        order={order}
        backHref={`/customer/orders/${order.id}`}
      />
    </div>
  );
}
