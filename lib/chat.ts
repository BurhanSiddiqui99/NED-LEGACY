import { Order } from "@/types";

/**
 * Whether the customer ↔ rider chat for an order is open.
 * Closed when the order is cancelled or delivered, and while no rider holds the order
 * (still pending, or an intercity parcel waiting at a warehouse between riders).
 * Pass `riderUid` when the viewer is a rider: only the rider currently holding the order can chat.
 */
export function getChatAvailability(
  order: Pick<Order, "status" | "riderId">,
  riderUid?: string
): { open: boolean; reason?: string } {
  if (order.status === "cancelled") return { open: false, reason: "This order was cancelled, so the chat is closed." };
  if (order.status === "delivered") return { open: false, reason: "This order was delivered, so the chat is closed." };
  if (!order.riderId) return { open: false, reason: "Chat opens once a rider is assigned to this order." };
  if (riderUid && order.riderId !== riderUid) {
    return { open: false, reason: "You are no longer the rider on this order." };
  }
  return { open: true };
}
