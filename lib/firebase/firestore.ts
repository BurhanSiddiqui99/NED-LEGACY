import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  writeBatch,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { MockStore } from "./mock-store";
import {
  AppNotification,
  AppUser,
  GeoLocation,
  Message,
  Order,
  OrderPriority,
  OrderStatus,
  Rider,
  UserRole,
} from "@/types";
import { NEXT_ALLOWED_STATUS, PRIORITY_CONFIG, STATUS_CONFIG, getOrderPriority } from "@/constants";

/* =========================================================================
   SHARED HELPERS
   ========================================================================= */

/** Converts Firestore Timestamps, ISO strings, Dates and epoch numbers into epoch millis. */
export function toMillis(val: any): number {
  if (!val) return 0;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.toDate === "function") return val.toDate().getTime();
  if (typeof val.seconds === "number") return val.seconds * 1000;
  const t = new Date(val).getTime();
  return isNaN(t) ? 0 : t;
}

// "estimate" makes locally-pending serverTimestamp() values readable immediately,
// so a just-sent message or just-created order sorts correctly before the server confirms it.
function snapData(d: DocumentSnapshot | QueryDocumentSnapshot): any {
  return d.data({ serverTimestamps: "estimate" }) || {};
}

function docToOrder(d: DocumentSnapshot | QueryDocumentSnapshot): Order {
  const data = snapData(d);
  return { ...data, id: data.id || d.id } as Order;
}

function sortOrdersDesc(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => toMillis(b.createdAt || b.updatedAt) - toMillis(a.createdAt || a.updatedAt)
  );
}

function newId(prefix: string): string {
  return prefix + Math.random().toString(36).substring(2, 11);
}

function statusLabel(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

/**
 * Notification inboxes a user reads from.
 * Besides their own uid, admins share the "admin" inbox, riders share the "riders"
 * broadcast inbox (new delivery requests), and everyone reads "all" (system alerts).
 */
export function getNotificationRecipients(userId: string, role?: UserRole | null): string[] {
  const ids = [userId, "all"];
  if (role === "admin") ids.push("admin");
  if (role === "rider") ids.push("riders");
  return Array.from(new Set(ids));
}

/** Fans one notification out to several inboxes. Never throws: a notification must not break the workflow. */
async function notify(
  userIds: (string | null | undefined)[],
  notif: Omit<AppNotification, "id" | "isRead" | "createdAt" | "userId">
): Promise<void> {
  const targets = Array.from(new Set(userIds.filter(Boolean) as string[]));
  await Promise.allSettled(targets.map((userId) => createNotification({ ...notif, userId })));
}

/* =========================================================================
   ORDERS
   ========================================================================= */

export async function createOrder(
  orderData: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "riderId">
): Promise<Order> {
  const priority = getOrderPriority(orderData);
  let orderId = "LP-" + Math.floor(10000 + Math.random() * 90000);

  const priorityTag = priority === "normal" ? "" : `[${PRIORITY_CONFIG[priority].label.toUpperCase()}] `;
  const announce = async () => {
    await notify([orderData.customerId], {
      title: "Order Placed Successfully",
      message: `Your delivery request #${orderId} has been placed. Waiting for a nearby rider.`,
      type: "order_created",
      orderId,
    });
    await notify(["admin"], {
      title: `${priorityTag}New Delivery Request`,
      message: `Order #${orderId} by ${orderData.customerName || "a customer"}: ${orderData.packageDescription}`,
      type: "order_created",
      orderId,
    });
    await notify(["riders"], {
      title: `${priorityTag}New Delivery Available`,
      message: `Pickup at ${orderData.pickupAddress.split(",")[0]}. Open Nearby Pickups to accept #${orderId}.`,
      type: "order_created",
      orderId,
    });
  };

  if (isFirebaseConfigured && db) {
    // Avoid silently overwriting an existing order on an ID collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const exists = (await getDoc(doc(db, "orders", orderId))).exists();
      if (!exists) break;
      orderId = "LP-" + Math.floor(10000 + Math.random() * 90000);
    }

    const newOrder: Order = {
      ...orderData,
      priority,
      id: orderId,
      riderId: null,
      status: "pending",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, "orders", orderId), newOrder);
    await announce();
    return { ...newOrder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  // Demo store mode
  const now = new Date().toISOString();
  const newOrder: Order = {
    ...orderData,
    priority,
    id: orderId,
    riderId: null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    price: orderData.price ?? Math.floor(250 + Math.random() * 350),
  };

  MockStore.saveOrder(newOrder);
  await announce();
  return newOrder;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "orders", orderId));
      return snap.exists() ? docToOrder(snap) : null;
    } catch (err) {
      console.error("Firestore getOrderById error:", err);
      return null;
    }
  }
  return MockStore.getOrder(orderId);
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      doc(db, "orders", orderId),
      (snap) => callback(snap.exists() ? docToOrder(snap) : null),
      (err) => {
        console.error("Firestore subscribeToOrder error:", err);
        callback(null);
      }
    );
  }

  const update = () => callback(MockStore.getOrder(orderId));
  update();
  return MockStore.subscribe(update);
}

export function subscribeToCustomerOrders(
  customerId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // No orderBy: sorting client-side avoids needing a composite index
    const q = query(collection(db, "orders"), where("customerId", "==", customerId));
    return onSnapshot(
      q,
      (snap) => callback(sortOrdersDesc(snap.docs.map(docToOrder))),
      (err) => {
        console.error("Firestore subscribeToCustomerOrders error:", err);
        callback([]);
      }
    );
  }

  const update = () => {
    callback(sortOrdersDesc(MockStore.getOrders().filter((o) => o.customerId === customerId)));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToAvailableOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    // Both filters are equalities, so Firestore serves this from single-field indexes.
    // Filtering on riderId == null also matches the security rule for riders.
    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      where("riderId", "==", null)
    );
    return onSnapshot(
      q,
      (snap) => callback(sortOrdersDesc(snap.docs.map(docToOrder))),
      (err) => {
        console.error("Firestore subscribeToAvailableOrders error:", err);
        callback([]);
      }
    );
  }

  const update = () => {
    callback(sortOrdersDesc(MockStore.getOrders().filter((o) => o.status === "pending" && !o.riderId)));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToRiderOrders(
  riderId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "orders"), where("riderId", "==", riderId));
    return onSnapshot(
      q,
      (snap) => callback(sortOrdersDesc(snap.docs.map(docToOrder))),
      (err) => {
        console.error("Firestore subscribeToRiderOrders error:", err);
        callback([]);
      }
    );
  }

  const update = () => {
    callback(sortOrdersDesc(MockStore.getOrders().filter((o) => o.riderId === riderId)));
  };
  update();
  return MockStore.subscribe(update);
}

export function subscribeToAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    // Query collection directly so documents missing createdAt are NOT dropped
    return onSnapshot(
      collection(firestore, "orders"),
      (snap) => callback(sortOrdersDesc(snap.docs.map(docToOrder))),
      (err) => {
        console.error("Firestore subscribeToAllOrders error:", err);
        getDocs(collection(firestore, "orders"))
          .then((snap) => callback(sortOrdersDesc(snap.docs.map(docToOrder))))
          .catch((e) => {
            console.error("Fallback all orders error:", e);
            callback([]);
          });
      }
    );
  }

  const update = () => callback(sortOrdersDesc(MockStore.getOrders()));
  update();
  return MockStore.subscribe(update);
}

/**
 * Atomically accepts an order. The transaction re-reads the order on the server, so if two
 * riders tap "Accept" at the same time only the first commit wins; the second sees
 * riderId already set and gets a clear error.
 */
export async function acceptOrder(orderId: string, rider: Rider): Promise<Order> {
  const riderVehicle = `${rider.vehicleType} (${rider.vehicleNumber})`;
  let accepted: Order;

  if (isFirebaseConfigured && db) {
    const orderRef = doc(db, "orders", orderId);
    accepted = await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order does not exist.");
      }
      const data = orderDoc.data() as Order;
      if (data.status !== "pending" || data.riderId) {
        throw new Error("Order has already been accepted by another rider.");
      }

      const updates: Partial<Order> = {
        riderId: rider.uid,
        riderName: rider.fullName || "Rider",
        riderPhone: rider.phone || "",
        riderVehicle,
        status: "accepted",
        currentRiderLocation: rider.currentLocation || null,
        riderLocationUpdatedAt: serverTimestamp() as any,
        acceptedAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      transaction.update(orderRef, updates);
      return { ...data, ...updates, id: orderId } as Order;
    });
  } else {
    const order = MockStore.getOrder(orderId);
    if (!order) {
      throw new Error("Order not found.");
    }
    if (order.status !== "pending" || order.riderId) {
      throw new Error("Order has already been accepted by another rider.");
    }

    const now = new Date().toISOString();
    accepted = {
      ...order,
      riderId: rider.uid,
      riderName: rider.fullName || "Tariq Mahmood",
      riderPhone: rider.phone || "+92 321 7654321",
      riderVehicle,
      status: "accepted",
      currentRiderLocation: rider.currentLocation || null,
      riderLocationUpdatedAt: now,
      acceptedAt: now,
      updatedAt: now,
    };
    MockStore.saveOrder(accepted);
  }

  await notify([accepted.customerId], {
    title: "Rider Assigned!",
    message: `${accepted.riderName || "A rider"} accepted order #${orderId} and is heading to pickup.`,
    type: "order_accepted",
    orderId,
  });
  await notify(["admin"], {
    title: "Order Accepted",
    message: `${accepted.riderName || "A rider"} accepted order #${orderId}.`,
    type: "order_accepted",
    orderId,
  });

  return accepted;
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
  const validate = (current: Order) => {
    if (actorRiderId && current.riderId !== actorRiderId) {
      throw new Error("Unauthorized: Only the assigned rider can update delivery status.");
    }
    const allowed = NEXT_ALLOWED_STATUS[current.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid transition: Cannot move from '${current.status}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}`
      );
    }
  };

  let updated: Order;

  if (isFirebaseConfigured && db) {
    const orderRef = doc(db, "orders", orderId);
    updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(orderRef);
      if (!snap.exists()) throw new Error("Order not found.");
      const current = docToOrder(snap);
      validate(current);

      const updates: Partial<Order> = {
        status: newStatus,
        updatedAt: serverTimestamp() as any,
      };
      if (newStatus === "delivered") {
        updates.deliveredAt = serverTimestamp() as any;
      }
      transaction.update(orderRef, updates);
      return { ...current, ...updates, updatedAt: new Date().toISOString() } as Order;
    });

    if (newStatus === "delivered" && updated.riderId) {
      try {
        await updateDoc(doc(db, "riders", updated.riderId), {
          completedDeliveries: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Could not increment rider delivery count:", e);
      }
    }
  } else {
    const current = MockStore.getOrder(orderId);
    if (!current) throw new Error("Order not found.");
    validate(current);

    const now = new Date().toISOString();
    updated = {
      ...current,
      status: newStatus,
      updatedAt: now,
      deliveredAt: newStatus === "delivered" ? now : current.deliveredAt,
    };
    MockStore.saveOrder(updated);

    if (newStatus === "delivered" && updated.riderId) {
      const rider = MockStore.getRider(updated.riderId);
      if (rider) {
        MockStore.saveRider({ ...rider, completedDeliveries: (rider.completedDeliveries || 0) + 1 });
      }
    }
  }

  const label = statusLabel(newStatus);
  const type = newStatus === "delivered" ? "delivery_completed" : "status_updated";
  await notify([updated.customerId], {
    title: `Order ${label}`,
    message:
      newStatus === "cancelled"
        ? `Your order #${orderId} was cancelled.`
        : `Your order #${orderId} is now ${label}.`,
    type,
    orderId,
  });
  await notify(["admin"], {
    title: `Order #${orderId}: ${label}`,
    message: `${updated.riderName || "Order"} moved #${orderId} to ${label}.`,
    type,
    orderId,
  });

  return updated;
}

export async function cancelOrder(orderId: string, actorId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found.");

  if (order.customerId !== actorId) {
    throw new Error("Only the customer who placed this order can cancel it.");
  }
  if (order.status !== "pending") {
    throw new Error("Only pending orders can be cancelled.");
  }

  return updateOrderStatus(orderId, "cancelled");
}

/** Admin escalation: change an order's priority (e.g. bump to URGENT during peak hours). */
export async function updateOrderPriority(orderId: string, priority: OrderPriority): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", orderId), { priority, updatedAt: serverTimestamp() });
  } else {
    const order = MockStore.getOrder(orderId);
    if (!order) throw new Error("Order not found.");
    MockStore.saveOrder({ ...order, priority });
  }

  const order = await getOrderById(orderId);
  await notify([order?.riderId, order?.customerId], {
    title: `Priority changed to ${PRIORITY_CONFIG[priority].label.toUpperCase()}`,
    message: `Operations set order #${orderId} to ${PRIORITY_CONFIG[priority].label} priority.`,
    type: "system",
    orderId,
  });
}

/**
 * Live rider tracking: the assigned rider's device writes its position onto the order,
 * and every dashboard watching that order (customer, admin) receives it via its snapshot listener.
 */
export async function updateRiderLiveLocation(
  orderId: string,
  riderId: string,
  location: GeoLocation
): Promise<void> {
  const currentRiderLocation = { latitude: location.latitude, longitude: location.longitude };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", orderId), {
      currentRiderLocation,
      riderLocationUpdatedAt: serverTimestamp(),
    });
    // Keep the rider profile in sync for Smart Nearby Pickup (best effort)
    updateDoc(doc(db, "riders", riderId), {
      currentLocation: currentRiderLocation,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
    return;
  }

  const order = MockStore.getOrder(orderId);
  if (order && order.riderId === riderId) {
    MockStore.saveOrder({
      ...order,
      currentRiderLocation,
      riderLocationUpdatedAt: new Date().toISOString(),
    });
  }
  const rider = MockStore.getRider(riderId);
  if (rider) {
    MockStore.saveRider({ ...rider, currentLocation: currentRiderLocation });
  }
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
    return onSnapshot(
      collection(db, "riders"),
      (snap) => callback(snap.docs.map((d) => snapData(d) as Rider)),
      (err) => {
        console.error("Firestore subscribeToAllRiders error:", err);
        callback([]);
      }
    );
  }
  const update = () => callback(MockStore.getRiders());
  update();
  return MockStore.subscribe(update);
}

/* =========================================================================
   USERS (Admin Management)
   ========================================================================= */

export function subscribeToAllUsers(callback: (users: AppUser[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      collection(db, "users"),
      (snap) => callback(snap.docs.map((d) => snapData(d) as AppUser)),
      (err) => {
        console.error("Firestore subscribeToAllUsers error:", err);
        callback([]);
      }
    );
  }
  const update = () => callback(MockStore.getUsers());
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
   Stored per order at orders/{orderId}/messages so security rules can
   authorise the realtime listener from the parent order's participants.
   ========================================================================= */

export async function sendMessage(
  orderId: string,
  senderId: string,
  receiverId: string,
  text: string,
  senderName?: string,
  senderRole?: "customer" | "rider" | "admin"
): Promise<Message> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Message is too long (max 2000 characters).");
  }

  const msgId = newId("msg-");
  const newMsg: Message = {
    id: msgId,
    orderId,
    senderId,
    receiverId,
    senderName: senderName || "",
    senderRole: senderRole || "customer",
    text: trimmed,
    createdAt: (isFirebaseConfigured ? serverTimestamp() : new Date().toISOString()) as any,
    isRead: false,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "orders", orderId, "messages", msgId), newMsg);
  } else {
    MockStore.addMessage({ ...newMsg, createdAt: new Date().toISOString() });
  }

  // Not awaited: the chat bubble should appear instantly, the alert can follow
  if (receiverId) {
    void notify([receiverId], {
      title: `New message from ${senderName || "your delivery partner"}`,
      message: trimmed.length > 60 ? trimmed.substring(0, 57) + "..." : trimmed,
      type: "new_message",
      orderId,
    });
  }

  return { ...newMsg, createdAt: new Date().toISOString() };
}

export function subscribeToMessages(
  orderId: string,
  callback: (messages: Message[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      collection(db, "orders", orderId, "messages"),
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = snapData(d);
          return { ...data, id: data.id || d.id } as Message;
        });
        msgs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
        callback(msgs);
      },
      (err) => {
        console.error("Firestore subscribeToMessages error:", err);
        callback([]);
        onError?.(err);
      }
    );
  }

  const update = () => {
    const msgs = MockStore.getMessages(orderId);
    msgs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
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
  const id = newId("notif-");

  if (isFirebaseConfigured && db) {
    const data: AppNotification = {
      ...notif,
      id,
      isRead: false,
      createdAt: serverTimestamp() as any,
    };
    // Firestore rejects undefined field values
    if (data.orderId === undefined) delete data.orderId;
    await setDoc(doc(db, "notifications", id), data);
    return;
  }

  MockStore.addNotification({
    ...notif,
    id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToNotifications(
  userId: string,
  role: UserRole | null | undefined,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const recipients = getNotificationRecipients(userId, role);

  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "notifications"), where("userId", "in", recipients));
    return onSnapshot(
      q,
      (snap) => {
        const notifs = snap.docs.map((d) => {
          const data = snapData(d);
          return { ...data, id: data.id || d.id } as AppNotification;
        });
        notifs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        callback(notifs);
      },
      (err) => {
        console.error("Firestore subscribeToNotifications error:", err);
        callback([]);
      }
    );
  }

  const update = () => {
    const notifs = MockStore.getNotifications(recipients);
    notifs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
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

export async function markAllNotificationsAsRead(userId: string, role?: UserRole | null): Promise<void> {
  const recipients = getNotificationRecipients(userId, role);

  if (isFirebaseConfigured && db) {
    const firestore = db;
    const snap = await getDocs(query(collection(firestore, "notifications"), where("userId", "in", recipients)));
    const unread = snap.docs.filter((d) => d.data().isRead === false);
    // Firestore batches are capped at 500 writes
    for (let i = 0; i < unread.length; i += 450) {
      const batch = writeBatch(firestore);
      unread.slice(i, i + 450).forEach((d) => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    }
    return;
  }
  MockStore.markAllNotificationsRead(recipients);
}
