import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { MockStore } from "./mock-store";
import { AppNotification, AppUser, Message, Order, OrderStatus, Rider } from "@/types";
import { NEXT_ALLOWED_STATUS } from "@/constants";

/* =========================================================================
   ORDERS
   ========================================================================= */

export async function createOrder(
  orderData: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "riderId">
): Promise<Order> {
  const orderId = "LP-" + Math.floor(10000 + Math.random() * 90000);

  if (isFirebaseConfigured && db) {
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      riderId: null,
      status: "pending",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, "orders", orderId), newOrder);

    // Create system notification for admins
    await createNotification({
      userId: "admin",
      title: "New Delivery Request Created",
      message: `Order #${orderId} was requested for ${orderData.packageDescription}`,
      type: "order_created",
      orderId,
    });

    return newOrder;
  }

  // Demo store mode
  const newOrder: Order = {
    ...orderData,
    id: orderId,
    riderId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: Math.floor(250 + Math.random() * 350),
  };

  MockStore.saveOrder(newOrder);

  // Notify riders and customer
  MockStore.addNotification({
    id: "notif-" + Math.random().toString(36).substring(2, 9),
    userId: orderData.customerId,
    title: "Order Placed Successfully",
    message: `Your delivery request #${orderId} has been placed. Waiting for nearby rider.`,
    type: "order_created",
    orderId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return newOrder;
}

function sortOrdersDesc(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const getTime = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === "function") return val.toMillis();
      if (typeof val.toDate === "function") return val.toDate().getTime();
      if (typeof val.seconds === "number") return val.seconds * 1000;
      const t = new Date(val).getTime();
      return isNaN(t) ? 0 : t;
    };
    return getTime(b.createdAt || b.updatedAt) - getTime(a.createdAt || a.updatedAt);
  });
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "orders", orderId));
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, id: data.id || snap.id } as Order;
      }
    } catch (err) {
      console.error("Firestore getOrderById error:", err);
    }
  }
  return MockStore.getOrder(orderId);
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      doc(db, "orders", orderId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback({ ...data, id: data.id || snap.id } as Order);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error("Firestore subscribeToOrder error:", err);
        callback(null);
      }
    );
  }

  // Mock store subscription
  const update = () => {
    callback(MockStore.getOrder(orderId));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToCustomerOrders(
  customerId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // Note: Querying without orderBy prevents requiring composite indexes in Firestore
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", customerId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map(
          (d) => ({ ...d.data(), id: d.data().id || d.id } as Order)
        );
        callback(sortOrdersDesc(orders));
      },
      (err) => {
        console.error("Firestore subscribeToCustomerOrders error:", err);
        getDocs(collection(db, "orders"))
          .then((snap) => {
            const all = snap.docs
              .map((d) => ({ ...d.data(), id: d.data().id || d.id } as Order))
              .filter((o) => o.customerId === customerId);
            callback(sortOrdersDesc(all));
          })
          .catch((e) => console.error("Fallback getDocs error:", e));
      }
    );
  }

  const update = () => {
    const orders = MockStore.getOrders().filter((o) => o.customerId === customerId);
    callback(sortOrdersDesc(orders));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToAvailableOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // Single where without riderId filter avoids multi-field index requirement
    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending")
    );
    return onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs
          .map((d) => ({ ...d.data(), id: d.data().id || d.id } as Order))
          .filter(
            (o) =>
              o.status === "pending" &&
              (!o.riderId || o.riderId === null || o.riderId === "" || o.riderId === "unassigned")
          );
        callback(sortOrdersDesc(orders));
      },
      (err) => {
        console.error("Firestore subscribeToAvailableOrders error:", err);
        getDocs(collection(db, "orders"))
          .then((snap) => {
            const available = snap.docs
              .map((d) => ({ ...d.data(), id: d.data().id || d.id } as Order))
              .filter(
                (o) =>
                  o.status === "pending" &&
                  (!o.riderId || o.riderId === null || o.riderId === "" || o.riderId === "unassigned")
              );
            callback(sortOrdersDesc(available));
          })
          .catch((e) => console.error("Fallback available orders error:", e));
      }
    );
  }

  const update = () => {
    const orders = MockStore.getOrders().filter(
      (o) => o.status === "pending" && (!o.riderId || o.riderId === null || o.riderId === "")
    );
    callback(sortOrdersDesc(orders));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToRiderOrders(
  riderId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // Single where filter without orderBy to prevent composite index requirement
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", riderId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map(
          (d) => ({ ...d.data(), id: d.data().id || d.id } as Order)
        );
        callback(sortOrdersDesc(orders));
      },
      (err) => {
        console.error("Firestore subscribeToRiderOrders error:", err);
        getDocs(collection(db, "orders"))
          .then((snap) => {
            const assigned = snap.docs
              .map((d) => ({ ...d.data(), id: d.data().id || d.id } as Order))
              .filter((o) => o.riderId === riderId);
            callback(sortOrdersDesc(assigned));
          })
          .catch((e) => console.error("Fallback rider orders error:", e));
      }
    );
  }

  const update = () => {
    const orders = MockStore.getOrders().filter((o) => o.riderId === riderId);
    callback(sortOrdersDesc(orders));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // Query collection directly so documents missing createdAt are NOT dropped
    const q = collection(db, "orders");
    return onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map(
          (d) => ({ ...d.data(), id: d.data().id || d.id } as Order)
        );
        callback(sortOrdersDesc(orders));
      },
      (err) => {
        console.error("Firestore subscribeToAllOrders error:", err);
        getDocs(collection(db, "orders"))
          .then((snap) => {
            const all = snap.docs.map(
              (d) => ({ ...d.data(), id: d.data().id || d.id } as Order)
            );
            callback(sortOrdersDesc(all));
          })
          .catch((e) => console.error("Fallback all orders error:", e));
      }
    );
  }

  const update = () => {
    callback(sortOrdersDesc(MockStore.getOrders()));
  };
  update();
  return MockStore.subscribe(update);
}

/**
 * Atomically accepts an order using a transaction to avoid race conditions.
 */
export async function acceptOrder(orderId: string, rider: Rider): Promise<Order> {
  if (isFirebaseConfigured && db) {
    const orderRef = doc(db, "orders", orderId);
    return await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order does not exist.");
      }
      const data = orderDoc.data() as Order;
      if (data.status !== "pending" || data.riderId !== null) {
        throw new Error("Order has already been accepted by another rider.");
      }

      const updates: Partial<Order> = {
        riderId: rider.uid,
        riderName: rider.fullName,
        riderPhone: rider.phone,
        riderVehicle: `${rider.vehicleType} (${rider.vehicleNumber})`,
        status: "accepted",
        acceptedAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      transaction.update(orderRef, updates);
      return { ...data, ...updates } as Order;
    });
  }

  // Mock store atomic logic
  const order = MockStore.getOrder(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.status !== "pending" || order.riderId !== null) {
    throw new Error("Order has already been accepted by another rider.");
  }

  const updatedOrder: Order = {
    ...order,
    riderId: rider.uid,
    riderName: rider.fullName || "Tariq Mahmood",
    riderPhone: rider.phone || "+92 321 7654321",
    riderVehicle: `${rider.vehicleType} (${rider.vehicleNumber})`,
    status: "accepted",
    acceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MockStore.saveOrder(updatedOrder);

  // Notify customer
  MockStore.addNotification({
    id: "notif-" + Math.random().toString(36).substring(2, 9),
    userId: order.customerId,
    title: "Rider Assigned!",
    message: `${rider.fullName || "A rider"} accepted order #${orderId} and is heading to pickup.`,
    type: "order_accepted",
    orderId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return updatedOrder;
}

/**
 * Updates order status with strict sequential validation:
 * accepted -> picked_up -> in_transit -> delivered
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorRiderId?: string
): Promise<Order> {
  const current = isFirebaseConfigured && db ? await getOrderById(orderId) : MockStore.getOrder(orderId);
  if (!current) {
    throw new Error("Order not found.");
  }

  // Authorization check if rider provided
  if (actorRiderId && current.riderId !== actorRiderId) {
    throw new Error("Unauthorized: Only the assigned rider can update delivery status.");
  }

  // Sequential transition validation
  const allowed = NEXT_ALLOWED_STATUS[current.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: Cannot move from '${current.status}' to '${newStatus}'. Allowed: ${allowed.join(", ")}`
    );
  }

  const now = new Date().toISOString();
  const updates: Partial<Order> = {
    status: newStatus,
    updatedAt: (isFirebaseConfigured ? serverTimestamp() : now) as any,
  };

  if (newStatus === "delivered") {
    updates.deliveredAt = (isFirebaseConfigured ? serverTimestamp() : now) as any;
  }

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", orderId), updates);
    return { ...current, ...updates } as Order;
  }

  const updated: Order = {
    ...current,
    ...updates,
    updatedAt: now,
    deliveredAt: newStatus === "delivered" ? now : current.deliveredAt,
  };

  MockStore.saveOrder(updated);

  // Increment rider completed deliveries if delivered
  if (newStatus === "delivered" && updated.riderId) {
    const rider = MockStore.getRider(updated.riderId);
    if (rider) {
      MockStore.saveRider({
        ...rider,
        completedDeliveries: (rider.completedDeliveries || 0) + 1,
      });
    }
  }

  // Create customer notification
  MockStore.addNotification({
    id: "notif-" + Math.random().toString(36).substring(2, 9),
    userId: updated.customerId,
    title: `Order Status: ${newStatus.replace("_", " ").toUpperCase()}`,
    message: `Your order #${orderId} status was updated to ${newStatus.replace("_", " ")}.`,
    type: newStatus === "delivered" ? "delivery_completed" : "status_updated",
    orderId,
    isRead: false,
    createdAt: now,
  });

  return updated;
}

export async function cancelOrder(orderId: string, actorId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found.");

  if (order.status !== "pending") {
    throw new Error("Only pending orders can be cancelled.");
  }

  return updateOrderStatus(orderId, "cancelled");
}

/* =========================================================================
   RIDERS
   ========================================================================= */

export async function getRiderProfile(uid: string): Promise<Rider | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "riders", uid));
    if (snap.exists()) return snap.data() as Rider;
  }
  return MockStore.getRider(uid);
}

export async function updateRiderLocation(
  uid: string,
  latitude: number,
  longitude: number
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "riders", uid), {
      currentLocation: { latitude, longitude },
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const rider = MockStore.getRider(uid);
  if (rider) {
    MockStore.saveRider({
      ...rider,
      currentLocation: { latitude, longitude },
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function updateRiderAvailability(uid: string, isAvailable: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "riders", uid), {
      isAvailable,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const rider = MockStore.getRider(uid);
  if (rider) {
    MockStore.saveRider({
      ...rider,
      isAvailable,
      updatedAt: new Date().toISOString(),
    });
  }
}

export function subscribeToAllRiders(callback: (riders: Rider[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(collection(db, "riders"), (snap) => {
      const riders = snap.docs.map((d) => d.data() as Rider);
      callback(riders);
    });
  }
  const update = () => {
    callback(MockStore.getRiders());
  };
  update();
  return MockStore.subscribe(update);
}

/* =========================================================================
   USERS (Admin Management)
   ========================================================================= */

export function subscribeToAllUsers(callback: (users: AppUser[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => d.data() as AppUser);
      callback(users);
    });
  }
  const update = () => {
    callback(MockStore.getUsers());
  };
  update();
  return MockStore.subscribe(update);
}

export async function toggleUserActive(uid: string, currentStatus: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "users", uid), {
      isActive: !currentStatus,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const user = MockStore.getUser(uid);
  if (user) {
    MockStore.saveUser({
      ...user,
      isActive: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function toggleRiderVerification(uid: string, currentStatus: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "riders", uid), {
      isVerified: !currentStatus,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const rider = MockStore.getRider(uid);
  if (rider) {
    MockStore.saveRider({
      ...rider,
      isVerified: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  }
}

/* =========================================================================
   MESSAGES (Chat)
   ========================================================================= */

export async function sendMessage(
  orderId: string,
  senderId: string,
  receiverId: string,
  text: string,
  senderName?: string
): Promise<Message> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const msgId = "msg-" + Math.random().toString(36).substring(2, 9);
  const newMsg: Message = {
    id: msgId,
    orderId,
    senderId,
    receiverId,
    senderName,
    text: trimmed,
    createdAt: (isFirebaseConfigured ? serverTimestamp() : new Date().toISOString()) as any,
    isRead: false,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "messages", msgId), newMsg);
    return newMsg;
  }

  MockStore.addMessage({
    ...newMsg,
    createdAt: new Date().toISOString(),
  });

  // Notify receiver
  MockStore.addNotification({
    id: "notif-" + Math.random().toString(36).substring(2, 9),
    userId: receiverId,
    title: `New Message from ${senderName || "Delivery Partner"}`,
    message: trimmed.length > 50 ? trimmed.substring(0, 47) + "..." : trimmed,
    type: "new_message",
    orderId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return newMsg;
}

export function subscribeToMessages(
  orderId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, "messages"),
      where("orderId", "==", orderId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as Message));
        msgs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return tA - tB;
        });
        callback(msgs);
      },
      (err) => {
        console.error("Firestore subscribeToMessages error:", err);
      }
    );
  }

  const update = () => {
    const msgs = MockStore.getMessages(orderId);
    callback(msgs);
  };
  update();
  return MockStore.subscribe(update);
}

/* =========================================================================
   NOTIFICATIONS
   ========================================================================= */

export async function createNotification(
  notif: Omit<AppNotification, "id" | "isRead" | "createdAt">
): Promise<void> {
  const id = "notif-" + Math.random().toString(36).substring(2, 9);
  const data: AppNotification = {
    ...notif,
    id,
    isRead: false,
    createdAt: (isFirebaseConfigured ? serverTimestamp() : new Date().toISOString()) as any,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "notifications", id), data);
    return;
  }

  MockStore.addNotification({
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "in", [userId, "all"])
    );
    return onSnapshot(
      q,
      (snap) => {
        const notifs = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as AppNotification));
        notifs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        callback(notifs);
      },
      (err) => {
        console.error("Firestore subscribeToNotifications error:", err);
      }
    );
  }

  const update = () => {
    const notifs = MockStore.getNotifications(userId);
    callback(notifs);
  };
  update();
  return MockStore.subscribe(update);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "notifications", id), { isRead: true });
    return;
  }
  MockStore.markNotificationRead(id);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    const snap = await getDocs(q);
    snap.forEach((d) => updateDoc(d.ref, { isRead: true }));
    return;
  }
  MockStore.markAllNotificationsRead(userId);
}
