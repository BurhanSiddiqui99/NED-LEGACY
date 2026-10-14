import {
  createOrder,
  getOrderById,
  subscribeToOrder,
  subscribeToCustomerOrders,
  subscribeToAvailableOrders,
  subscribeToRiderOrders,
  subscribeToAllOrders,
  acceptOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/lib/firebase/firestore";
import { Order, OrderStatus, Rider } from "@/types";

export const ordersService = {
  async create(orderData: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "riderId">) {
    return createOrder(orderData);
  },

  async getById(orderId: string) {
    return getOrderById(orderId);
  },

  subscribeById(orderId: string, callback: (order: Order | null) => void) {
    return subscribeToOrder(orderId, callback);
  },

  subscribeCustomerOrders(customerId: string, callback: (orders: Order[]) => void) {
    return subscribeToCustomerOrders(customerId, callback);
  },

  subscribeAvailableOrders(callback: (orders: Order[]) => void) {
    return subscribeToAvailableOrders(callback);
  },

  subscribeRiderOrders(riderId: string, callback: (orders: Order[]) => void) {
    return subscribeToRiderOrders(riderId, callback);
  },

  subscribeAllOrders(callback: (orders: Order[]) => void) {
    return subscribeToAllOrders(callback);
  },

  async accept(orderId: string, rider: Rider) {
    return acceptOrder(orderId, rider);
  },

  async updateStatus(orderId: string, newStatus: OrderStatus, actorRiderId?: string) {
    return updateOrderStatus(orderId, newStatus, actorRiderId);
  },

  async cancel(orderId: string, actorId: string) {
    return cancelOrder(orderId, actorId);
  },
};
