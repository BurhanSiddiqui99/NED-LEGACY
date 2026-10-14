import {
  createOrder,
  getOrderById,
  subscribeToOrder,
  subscribeToCustomerOrders,
  subscribeToAvailableOrders,
  subscribeToRiderOrders,
  subscribeToAllOrders,
  acceptOrder,
  rejectOrder,
  advanceOrder,
  cancelOrder,
  updateOrderPriority,
  updateRiderLiveLocation,
  recordOtpChallenge,
  recordVerification,
} from "@/lib/firebase/firestore";
import {
  GeoLocation,
  Order,
  OrderPriority,
  OrderStatus,
  OtpChallenge,
  Rider,
  UserRole,
  VerificationCheckpoint,
  VerificationParty,
} from "@/types";

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

  async reject(orderId: string, rider: Rider, reason: string) {
    return rejectOrder(orderId, rider, reason);
  },

  async advance(orderId: string, to: OrderStatus, actor: { uid: string; role: UserRole | null; name?: string }) {
    return advanceOrder(orderId, to, actor);
  },

  async cancel(orderId: string, actorId: string) {
    return cancelOrder(orderId, actorId);
  },

  async updatePriority(orderId: string, priority: OrderPriority) {
    return updateOrderPriority(orderId, priority);
  },

  async updateLiveLocation(orderId: string, riderId: string, location: GeoLocation) {
    return updateRiderLiveLocation(orderId, riderId, location);
  },

  async recordOtpChallenge(
    orderId: string,
    checkpoint: VerificationCheckpoint,
    party: VerificationParty,
    challenge: OtpChallenge
  ) {
    return recordOtpChallenge(orderId, checkpoint, party, challenge);
  },

  async recordVerification(
    orderId: string,
    checkpoint: VerificationCheckpoint,
    party: VerificationParty,
    actorUid: string
  ) {
    return recordVerification(orderId, checkpoint, party, actorUid);
  },
};
