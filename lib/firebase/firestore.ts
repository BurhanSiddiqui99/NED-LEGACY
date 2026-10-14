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
import { auth, db, isFirebaseConfigured } from "./config";
import { MockStore } from "./mock-store";
import {
  AppNotification,
  AppUser,
  GeoLocation,
  Message,
  Order,
  OrderPriority,
  OrderStatus,
  OtpChallenge,
  Rider,
  RiderRejection,
  UserRole,
  VerificationCheckpoint,
  VerificationParty,
} from "@/types";
import { PRIORITY_CONFIG, STATUS_CONFIG, getOrderPriority } from "@/constants";
import {
  CLAIMABLE_STATUSES,
  cityRidersInbox,
  getDeliveryType,
  getNextTransition,
  getOrderStartWarehouseId,
  nearestWarehouse,
} from "@/lib/logistics";

/* =========================================================================
   SHARED HELPERS
   ========================================================================= */

/**
 * Logs a realtime listener failure. Right after sign-out every open listener fails with
 * permission-denied before its component unmounts; those are expected and not logged.
 */
function logListenError(label: string, err: unknown) {
  if (isFirebaseConfigured && !auth?.currentUser) return;
  console.error(`Firestore ${label} error:`, err);
}

function isSignedOut(): boolean {
  return isFirebaseConfigured && !auth?.currentUser;
}

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
export function getNotificationRecipients(
  userId: string,
  role?: UserRole | null,
  // Riders also get new-job alerts for the city they are currently in
  riderWarehouseId?: string | null
): string[] {
  const ids = [userId, "all"];
  if (role === "admin") ids.push("admin");
  if (role === "rider") ids.push("riders");
  if (role === "rider" && riderWarehouseId) ids.push(cityRidersInbox(riderWarehouseId));
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

/** Firestore rejects `undefined` values, so drop them before writing. */
function withoutUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Read-modify-write on one order. In Firestore this runs as a transaction, so concurrent
 * writers (two riders accepting, rider + admin at a warehouse) cannot overwrite each other.
 */
async function mutateOrder(orderId: string, mutate: (current: Order) => Partial<Order>): Promise<Order> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, "orders", orderId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Order not found.");
      const current = docToOrder(snap);
      const updates = withoutUndefined({ ...mutate(current) });
      tx.update(ref, { ...updates, updatedAt: serverTimestamp() });
      return { ...current, ...updates, updatedAt: new Date().toISOString() } as Order;
    });
  }

  const current = MockStore.getOrder(orderId);
  if (!current) throw new Error("Order not found.");
  const updated = { ...current, ...withoutUndefined({ ...mutate(current) }), updatedAt: new Date().toISOString() } as Order;
  MockStore.saveOrder(updated);
  return updated;
}

function historyEntry(status: OrderStatus, by?: string) {
  return { status, at: new Date().toISOString(), by };
}

export async function createOrder(
  orderData: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "riderId">
): Promise<Order> {
  const priority = getOrderPriority(orderData);
  let orderId = "LP-" + Math.floor(10000 + Math.random() * 90000);
  const intercity = orderData.deliveryType === "intercity";

  const priorityTag = priority === "normal" ? "" : `[${PRIORITY_CONFIG[priority].label.toUpperCase()}] `;
  const routeTag = intercity ? ` (${orderData.originCity} → ${orderData.destinationCity})` : "";
  const announce = async () => {
    await notify([orderData.customerId], {
      title: "Order Placed Successfully",
      message: `Your delivery request #${orderId} has been placed. Waiting for a nearby rider.`,
      type: "order_created",
      orderId,
    });
    await notify(["admin"], {
      title: `${priorityTag}New ${intercity ? "Intercity " : ""}Delivery Request`,
      message: `Order #${orderId}${routeTag} by ${orderData.customerName || "a customer"}: ${orderData.packageDescription}`,
      type: "order_created",
      orderId,
    });
    // Only riders in the pickup city are told about a new request
    const pickupWarehouseId = orderData.originWarehouseId || nearestWarehouse(orderData.pickupLocation).warehouse.id;
    await notify([cityRidersInbox(pickupWarehouseId)], {
      title: `${priorityTag}New Delivery Available`,
      message: `Pickup at ${orderData.pickupAddress.split(",")[0]}. Open Nearby Pickups to accept #${orderId}.`,
      type: "order_created",
      orderId,
    });
  };

  const base = {
    ...orderData,
    priority,
    deliveryType: orderData.deliveryType || "intracity",
    riderId: null,
    riderIds: [],
    rejectedBy: [],
    rejections: [],
    status: "pending" as OrderStatus,
    statusHistory: [historyEntry("pending", orderData.customerId)],
  };

  if (isFirebaseConfigured && db) {
    // Avoid silently overwriting an existing order on an ID collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const exists = (await getDoc(doc(db, "orders", orderId))).exists();
      if (!exists) break;
      orderId = "LP-" + Math.floor(10000 + Math.random() * 90000);
    }

    const newOrder = withoutUndefined({
      ...base,
      id: orderId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }) as Order;

    await setDoc(doc(db, "orders", orderId), newOrder);
    await announce();
    return { ...newOrder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  // Demo store mode
  const now = new Date().toISOString();
  const newOrder = withoutUndefined({
    ...base,
    id: orderId,
    createdAt: now,
    updatedAt: now,
    price: orderData.price ?? Math.floor(250 + Math.random() * 350),
  }) as Order;

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
      logListenError("getOrderById", err);
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
        logListenError("subscribeToOrder", err);
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
        logListenError("subscribeToCustomerOrders", err);
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

/**
 * Orders a rider can claim: new requests (first mile) and intercity parcels waiting at a
 * destination warehouse (last mile). Orders this rider has rejected are filtered out by the caller.
 */
export function subscribeToAvailableOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    // One equality-only listener per claimable status: served by single-field indexes and
    // matching the security rule (riderId == null) exactly.
    const buckets = new Map<OrderStatus, Order[]>();
    const emit = () => callback(sortOrdersDesc(Array.from(buckets.values()).flat()));
    const unsubs = CLAIMABLE_STATUSES.map((status) =>
      onSnapshot(
        query(collection(firestore, "orders"), where("status", "==", status), where("riderId", "==", null)),
        (snap) => {
          buckets.set(status, snap.docs.map(docToOrder));
          emit();
        },
        (err) => {
          logListenError(`available orders (${status})`, err);
          buckets.set(status, []);
          emit();
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }

  const update = () => {
    callback(sortOrdersDesc(MockStore.getOrders().filter((o) => CLAIMABLE_STATUSES.includes(o.status) && !o.riderId)));
  };
  update();
  return MockStore.subscribe(update);
}

/** Every order the rider is or was responsible for (current assignment + earlier legs). */
export function subscribeToRiderOrders(
  riderId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    let current: Order[] = [];
    let history: Order[] = [];
    const emit = () => {
      const byId = new Map<string, Order>();
      [...history, ...current].forEach((o) => byId.set(o.id, o));
      callback(sortOrdersDesc(Array.from(byId.values())));
    };
    const onErr = (err: Error) => logListenError("subscribeToRiderOrders", err);
    const u1 = onSnapshot(
      query(collection(firestore, "orders"), where("riderId", "==", riderId)),
      (snap) => {
        current = snap.docs.map(docToOrder);
        emit();
      },
      onErr
    );
    const u2 = onSnapshot(
      query(collection(firestore, "orders"), where("riderIds", "array-contains", riderId)),
      (snap) => {
        history = snap.docs.map(docToOrder);
        emit();
      },
      onErr
    );
    return () => {
      u1();
      u2();
    };
  }

  const update = () => {
    callback(
      sortOrdersDesc(MockStore.getOrders().filter((o) => o.riderId === riderId || o.riderIds?.includes(riderId)))
    );
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
        logListenError("subscribeToAllOrders", err);
        if (isSignedOut()) return;
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
 * Claims an order from the nearby feed. Handles both legs: a new request (first mile) and an
 * intercity parcel waiting at the destination warehouse (last mile). Runs in a transaction,
 * so if two riders tap "Accept" together only the first commit wins.
 */
export async function acceptOrder(orderId: string, rider: Rider): Promise<Order> {
  const riderVehicle = `${rider.vehicleType} (${rider.vehicleNumber})`;
  const now = new Date().toISOString();

  const accepted = await mutateOrder(orderId, (current) => {
    if (!CLAIMABLE_STATUSES.includes(current.status) || current.riderId) {
      throw new Error("Order has already been accepted by another rider.");
    }
    if (rider.warehouseId && getOrderStartWarehouseId(current) !== rider.warehouseId) {
      throw new Error(`This job is outside your city (${rider.city || "home city"}).`);
    }
    const lastMile = current.status === "at_destination_warehouse";
    const next: OrderStatus = lastMile ? "last_mile_accepted" : "accepted";
    return {
      riderId: rider.uid,
      riderName: rider.fullName || "Rider",
      riderPhone: rider.phone || "",
      riderVehicle,
      status: next,
      riderIds: Array.from(new Set([...(current.riderIds || []), rider.uid])),
      ...(lastMile
        ? {}
        : { firstMileRiderId: rider.uid, firstMileRiderName: rider.fullName || "Rider", acceptedAt: now }),
      currentRiderLocation: rider.currentLocation || null,
      riderLocationUpdatedAt: now,
      statusHistory: [...(current.statusHistory || []), historyEntry(next, rider.uid)],
    };
  });

  const lastMile = accepted.status === "last_mile_accepted";
  await notify([accepted.customerId], {
    title: lastMile ? "Last-mile rider assigned" : "Rider Assigned!",
    message: lastMile
      ? `${accepted.riderName} will collect #${orderId} from the ${accepted.destinationCity} warehouse and deliver it.`
      : `${accepted.riderName} accepted order #${orderId} and is heading to pickup.`,
    type: "order_accepted",
    orderId,
  });
  await notify(["admin"], {
    title: lastMile ? "Last-mile rider assigned" : "Order Accepted",
    message: `${accepted.riderName} accepted order #${orderId}.`,
    type: "order_accepted",
    orderId,
  });

  return accepted;
}

/**
 * A rider declines a request. The order stays open for every other nearby rider, disappears
 * from this rider's feed, and the rejection (with reason) is logged for the admin.
 */
export async function rejectOrder(orderId: string, rider: Rider, reason: string): Promise<void> {
  const cleanReason = reason.trim().slice(0, 200) || "No reason given";
  const order = await mutateOrder(orderId, (current) => {
    if (!CLAIMABLE_STATUSES.includes(current.status) || current.riderId) {
      throw new Error("This order is no longer open.");
    }
    if (current.rejectedBy?.includes(rider.uid)) return {};
    const rejection: RiderRejection = {
      riderId: rider.uid,
      riderName: rider.fullName || "Rider",
      reason: cleanReason,
      at: new Date().toISOString(),
      leg: current.status === "at_destination_warehouse" ? "last_mile" : "first_mile",
    };
    return {
      rejectedBy: [...(current.rejectedBy || []), rider.uid],
      rejections: [...(current.rejections || []), rejection],
    };
  });

  await notify(["admin"], {
    title: `Order #${orderId} rejected by ${rider.fullName || "a rider"}`,
    message: `Reason: ${cleanReason}. ${order.rejections?.length || 1} rejection(s) so far; still visible to other riders.`,
    type: "order_rejected",
    orderId,
  });
}

const CHECKPOINT_PLACES: Record<VerificationCheckpoint, string> = {
  pickup: "pickup",
  origin_warehouse: "warehouse drop-off",
  warehouse_handover: "warehouse handover",
  delivery: "delivery",
};

/** Saves the server-signed OTP token for one party at a checkpoint (the code itself is only emailed). */
export async function recordOtpChallenge(
  orderId: string,
  checkpoint: VerificationCheckpoint,
  party: VerificationParty,
  challenge: OtpChallenge
): Promise<void> {
  const order = await mutateOrder(orderId, (current) => {
    const record = current.verifications?.[checkpoint] || {};
    const verifiedBy = { ...(record.verifiedBy || {}) };
    delete verifiedBy[party];
    return {
      verifications: {
        ...(current.verifications || {}),
        [checkpoint]: { ...record, challenges: { ...(record.challenges || {}), [party]: challenge }, verifiedBy },
      },
    };
  });

  // Tell the verifying party to ask the rider for the code
  await notify([party === "customer" ? order.customerId : "admin"], {
    title: `Verify ${CHECKPOINT_PLACES[checkpoint]} for #${orderId}`,
    message: `${order.riderName || "The rider"} has a verification code. Ask them for it and enter it on the order page.`,
    type: "verification",
    orderId,
  });
}

export function isCheckpointVerified(order: Order, checkpoint: VerificationCheckpoint, parties: VerificationParty[]): boolean {
  const verifiedBy = order.verifications?.[checkpoint]?.verifiedBy || {};
  return parties.every((p) => Boolean(verifiedBy[p]));
}

const STATUS_MESSAGES: Partial<Record<OrderStatus, (o: Order) => string>> = {
  picked_up: (o) => `${o.riderName || "Your rider"} collected order #${o.id} (verified with the OTP).`,
  in_transit: (o) =>
    getDeliveryType(o) === "intercity"
      ? `Order #${o.id} is on the way to the ${o.originCity} warehouse.`
      : `Order #${o.id} is on the way to the drop-off.`,
  at_origin_warehouse: (o) => `Order #${o.id} was received at the ${o.originCity} warehouse.`,
  linehaul: (o) => `Order #${o.id} left ${o.originCity} for the ${o.destinationCity} warehouse.`,
  at_destination_warehouse: (o) => `Order #${o.id} arrived at the ${o.destinationCity} warehouse. Assigning a delivery rider.`,
  out_for_delivery: (o) => `${o.riderName || "A rider"} collected order #${o.id} from the warehouse and is out for delivery.`,
  delivered: (o) => `Order #${o.id} was delivered (verified with the OTP).`,
};

/** Field changes for moving `current` one step to `to` (shared by rider/admin actions and OTP auto-completion). */
function transitionUpdates(current: Order, to: OrderStatus, actorUid: string): Partial<Order> {
  const transition = getNextTransition(current);
  const now = new Date().toISOString();
  const updates: Partial<Order> = {
    status: to,
    statusHistory: [...(current.statusHistory || []), historyEntry(to, actorUid)],
  };
  if (transition?.checkpoint) {
    const record = current.verifications?.[transition.checkpoint] || {};
    updates.verifications = {
      ...(current.verifications || {}),
      [transition.checkpoint]: { ...record, completedAt: now },
    };
  }
  if (to === "delivered") updates.deliveredAt = now;
  // First-mile rider's job ends at the origin warehouse; the order waits there without a rider
  if (to === "at_origin_warehouse") {
    updates.riderId = null;
    updates.currentRiderLocation = null;
  }
  return updates;
}

/** Notifications and rider stats after a step completes. */
async function afterTransition(updated: Order, to: OrderStatus, previousRiderId: string | null) {
  const orderId = updated.id;

  // Count completed jobs for the rider whose leg just finished
  if ((to === "delivered" || to === "at_origin_warehouse") && previousRiderId) {
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "riders", previousRiderId), { completedDeliveries: increment(1), updatedAt: serverTimestamp() }).catch(
        (e) => console.warn("Could not increment rider delivery count:", e)
      );
    } else {
      const rider = MockStore.getRider(previousRiderId);
      if (rider) MockStore.saveRider({ ...rider, completedDeliveries: (rider.completedDeliveries || 0) + 1 });
    }
  }

  const label = statusLabel(to);
  const type = to === "delivered" ? "delivery_completed" : "status_updated";
  const message = STATUS_MESSAGES[to]?.(updated) || `Order #${orderId} is now ${label}.`;
  await notify([updated.customerId], { title: `Order ${label}`, message, type, orderId });
  await notify(["admin"], { title: `Order #${orderId}: ${label}`, message, type, orderId });
  if (previousRiderId && (to === "picked_up" || to === "delivered" || to === "at_origin_warehouse" || to === "out_for_delivery")) {
    await notify([previousRiderId], { title: `Verified: ${label}`, message, type, orderId });
  }
  if (to === "at_destination_warehouse") {
    await notify([updated.destinationWarehouseId ? cityRidersInbox(updated.destinationWarehouseId) : "riders"], {
      title: "Parcel ready for last-mile delivery",
      message: `#${orderId} is waiting at the ${updated.destinationCity} warehouse. Open Nearby Pickups to claim it.`,
      type: "order_created",
      orderId,
    });
  }
}

/**
 * Marks a party's OTP as confirmed (called only after /api/otp/verify accepted the code).
 * When this was the last code the current step needed, the step completes in the same write:
 * the customer entering the rider's pickup code *is* the pickup.
 */
export async function recordVerification(
  orderId: string,
  checkpoint: VerificationCheckpoint,
  party: VerificationParty,
  actorUid: string
): Promise<{ order: Order; completedStep: OrderStatus | null }> {
  let completedStep: OrderStatus | null = null;
  let previousRiderId: string | null = null;

  const order = await mutateOrder(orderId, (current) => {
    const record = current.verifications?.[checkpoint] || {};
    const verifications = {
      ...(current.verifications || {}),
      [checkpoint]: { ...record, verifiedBy: { ...(record.verifiedBy || {}), [party]: new Date().toISOString() } },
    };
    const withCode = { ...current, verifications } as Order;

    const transition = getNextTransition(current);
    if (
      transition?.checkpoint === checkpoint &&
      isCheckpointVerified(withCode, checkpoint, transition.parties || [])
    ) {
      completedStep = transition.to;
      previousRiderId = current.riderId;
      return transitionUpdates(withCode, transition.to, actorUid);
    }
    return { verifications };
  });

  if (completedStep) await afterTransition(order, completedStep, previousRiderId);
  return { order, completedStep };
}

/**
 * Moves an order one step along its workflow (lib/logistics.ts) for steps without an OTP
 * (rider: start ride; admin: dispatch / arrival). OTP steps complete automatically in recordVerification.
 */
export async function advanceOrder(
  orderId: string,
  to: OrderStatus,
  actor: { uid: string; role: UserRole | null; name?: string }
): Promise<Order> {
  let previousRiderId: string | null = null;

  const updated = await mutateOrder(orderId, (current) => {
    const transition = getNextTransition(current);
    if (!transition || transition.to !== to) {
      throw new Error(`Invalid step: '${STATUS_CONFIG[current.status]?.label}' cannot move to '${STATUS_CONFIG[to]?.label}'.`);
    }
    if (transition.actor === "rider" && current.riderId !== actor.uid) {
      throw new Error("Only the assigned rider can complete this step.");
    }
    if (transition.actor === "admin" && actor.role !== "admin") {
      throw new Error("Only an admin can complete this step.");
    }
    if (transition.checkpoint && !isCheckpointVerified(current, transition.checkpoint, transition.parties || [])) {
      throw new Error("Waiting for the OTP to be verified.");
    }
    previousRiderId = current.riderId;
    return transitionUpdates(current, to, actor.uid);
  });

  await afterTransition(updated, to, previousRiderId);
  return updated;
}

export async function cancelOrder(orderId: string, actorId: string): Promise<Order> {
  const updated = await mutateOrder(orderId, (current) => {
    if (current.customerId !== actorId) {
      throw new Error("Only the customer who placed this order can cancel it.");
    }
    if (current.status !== "pending") {
      throw new Error("Only pending orders can be cancelled.");
    }
    return {
      status: "cancelled",
      statusHistory: [...(current.statusHistory || []), historyEntry("cancelled", actorId)],
    };
  });

  await notify(["admin"], {
    title: `Order #${orderId} cancelled`,
    message: `${updated.customerName || "The customer"} cancelled the request.`,
    type: "status_updated",
    orderId,
  });
  return updated;
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

export function subscribeToRiderProfile(uid: string, callback: (rider: Rider | null) => void): Unsubscribe {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      doc(db, "riders", uid),
      (snap) => callback(snap.exists() ? (snapData(snap) as Rider) : null),
      (err) => {
        logListenError("subscribeToRiderProfile", err);
      }
    );
  }
  const update = () => callback(MockStore.getRider(uid));
  update();
  return MockStore.subscribe(update);
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
        logListenError("subscribeToAllRiders", err);
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
        logListenError("subscribeToAllUsers", err);
        callback([]);
      }
    );
  }
  const update = () => callback(MockStore.getUsers());
  update();
  return MockStore.subscribe(update);
}

/** Email for OTP delivery on orders created before customerEmail was stored on the order. */
export async function getUserEmail(uid: string): Promise<string | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as AppUser).email || null : null;
  }
  return MockStore.getUser(uid)?.email || null;
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

/** Admin: assign or change the city a rider works in. */
export async function setRiderCity(uid: string, warehouseId: string, city: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "riders", uid), { warehouseId, city, updatedAt: serverTimestamp() });
    return;
  }
  const rider = MockStore.getRider(uid);
  if (rider) MockStore.saveRider({ ...rider, warehouseId, city });
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
        logListenError("subscribeToMessages", err);
        callback([]);
        if (!isSignedOut()) onError?.(err);
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
  callback: (notifications: AppNotification[]) => void,
  riderWarehouseId?: string | null
): Unsubscribe {
  const recipients = getNotificationRecipients(userId, role, riderWarehouseId);

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
        logListenError("subscribeToNotifications", err);
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

export async function markAllNotificationsAsRead(
  userId: string,
  role?: UserRole | null,
  riderWarehouseId?: string | null
): Promise<void> {
  const recipients = getNotificationRecipients(userId, role, riderWarehouseId);

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
