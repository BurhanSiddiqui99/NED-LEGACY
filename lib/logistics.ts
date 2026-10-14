import {
  DeliveryType,
  GeoLocation,
  Order,
  OrderStatus,
  VerificationCheckpoint,
  VerificationParty,
  Warehouse,
} from "@/types";
import { calculateDistance } from "@/lib/distance";

/* =========================================================================
   WAREHOUSES: one hub per serviced city
   ========================================================================= */

export const WAREHOUSES: Warehouse[] = [
  { id: "wh-karachi", city: "Karachi", province: "Sindh", name: "Karachi Central Hub", address: "Shahrah-e-Faisal, PECHS, Karachi", latitude: 24.87, longitude: 67.08, serviceRadiusKm: 45, capacityParcels: 800 },
  { id: "wh-lahore", city: "Lahore", province: "Punjab", name: "Lahore Gulberg Hub", address: "Main Boulevard, Gulberg, Lahore", latitude: 31.5204, longitude: 74.3587, serviceRadiusKm: 40, capacityParcels: 700 },
  { id: "wh-islamabad", city: "Islamabad", province: "Islamabad Capital Territory", name: "Islamabad I-9 Hub", address: "I-9 Industrial Area, Islamabad", latitude: 33.6844, longitude: 73.0479, serviceRadiusKm: 20, capacityParcels: 500 },
  { id: "wh-rawalpindi", city: "Rawalpindi", province: "Punjab", name: "Rawalpindi Saddar Hub", address: "Murree Road, Rawalpindi", latitude: 33.5651, longitude: 73.0169, serviceRadiusKm: 15, capacityParcels: 400 },
  { id: "wh-faisalabad", city: "Faisalabad", province: "Punjab", name: "Faisalabad Hub", address: "Jaranwala Road, Faisalabad", latitude: 31.4504, longitude: 73.135, serviceRadiusKm: 30, capacityParcels: 350 },
  { id: "wh-multan", city: "Multan", province: "Punjab", name: "Multan Hub", address: "Bosan Road, Multan", latitude: 30.1575, longitude: 71.5249, serviceRadiusKm: 30, capacityParcels: 300 },
  { id: "wh-peshawar", city: "Peshawar", province: "Khyber Pakhtunkhwa", name: "Peshawar Hub", address: "Ring Road, Hayatabad, Peshawar", latitude: 34.0151, longitude: 71.5249, serviceRadiusKm: 30, capacityParcels: 300 },
  { id: "wh-quetta", city: "Quetta", province: "Balochistan", name: "Quetta Hub", address: "Airport Road, Quetta", latitude: 30.1798, longitude: 66.975, serviceRadiusKm: 30, capacityParcels: 250 },
  { id: "wh-hyderabad", city: "Hyderabad", province: "Sindh", name: "Hyderabad Hub", address: "Auto Bhan Road, Hyderabad", latitude: 25.396, longitude: 68.3578, serviceRadiusKm: 30, capacityParcels: 250 },
  { id: "wh-sialkot", city: "Sialkot", province: "Punjab", name: "Sialkot Hub", address: "Daska Road, Sialkot", latitude: 32.4945, longitude: 74.5229, serviceRadiusKm: 25, capacityParcels: 200 },
];

export function getWarehouse(id?: string | null): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id);
}

export function warehouseLocation(w: Warehouse): GeoLocation {
  return { latitude: w.latitude, longitude: w.longitude };
}

/** The warehouse (and so the city) that serves a point: the nearest hub. */
export function nearestWarehouse(point: GeoLocation): { warehouse: Warehouse; distanceKm: number; inServiceArea: boolean } {
  let best = WAREHOUSES[0];
  let bestKm = Infinity;
  for (const w of WAREHOUSES) {
    const km = calculateDistance(point.latitude, point.longitude, w.latitude, w.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = w;
    }
  }
  return { warehouse: best, distanceKm: bestKm, inServiceArea: bestKm <= best.serviceRadiusKm };
}

/* =========================================================================
   PRICING
   ========================================================================= */

/** Flat delivery price by how far apart the pickup and drop-off cities are. */
export type PriceZone = "same_city" | "same_province" | "inter_province";

export const ZONE_PRICES: Record<PriceZone, { pkr: number; label: string }> = {
  same_city: { pkr: 250, label: "Same city" },
  same_province: { pkr: 400, label: "Different city, same province" },
  inter_province: { pkr: 600, label: "Different province" },
};

export interface RoutePlan {
  deliveryType: DeliveryType;
  priceZone: PriceZone;
  originWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  originInArea: boolean;
  destinationInArea: boolean;
  firstMileKm: number; // intercity: pickup -> origin warehouse
  linehaulKm: number; // intercity: origin warehouse -> destination warehouse
  lastMileKm: number; // intercity: destination warehouse -> drop-off
  directKm: number; // pickup -> drop-off
}

/** Warehouse for a point, or the explicitly chosen city's warehouse when the customer picked one. */
function resolveWarehouse(point: GeoLocation, chosenWarehouseId?: string | null) {
  const chosen = getWarehouse(chosenWarehouseId);
  if (!chosen) return nearestWarehouse(point);
  const distanceKm = calculateDistance(point.latitude, point.longitude, chosen.latitude, chosen.longitude);
  return { warehouse: chosen, distanceKm, inServiceArea: distanceKm <= chosen.serviceRadiusKm };
}

export function planRoute(
  pickup: GeoLocation,
  dropoff: GeoLocation,
  // Sender / receiver city chosen in the form; defaults to the city detected from each address
  cities: { originWarehouseId?: string | null; destinationWarehouseId?: string | null } = {}
): RoutePlan {
  const origin = resolveWarehouse(pickup, cities.originWarehouseId);
  const destination = resolveWarehouse(dropoff, cities.destinationWarehouseId);
  const intercity = origin.warehouse.id !== destination.warehouse.id;
  const priceZone: PriceZone = !intercity
    ? "same_city"
    : origin.warehouse.province === destination.warehouse.province
    ? "same_province"
    : "inter_province";
  return {
    deliveryType: intercity ? "intercity" : "intracity",
    priceZone,
    originWarehouse: origin.warehouse,
    destinationWarehouse: destination.warehouse,
    originInArea: origin.inServiceArea,
    destinationInArea: destination.inServiceArea,
    firstMileKm: origin.distanceKm,
    linehaulKm: calculateDistance(
      origin.warehouse.latitude,
      origin.warehouse.longitude,
      destination.warehouse.latitude,
      destination.warehouse.longitude
    ),
    lastMileKm: destination.distanceKm,
    directKm: calculateDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude),
  };
}

/**
 * Flat zone pricing: PKR 250 within a city, PKR 400 to another city in the same province,
 * PKR 600 across provinces. HIGH / URGENT priority adds its surcharge on top.
 */
export function calculateFare(
  plan: RoutePlan,
  prioritySurchargePKR: number
): { total: number; breakdown: { label: string; amount: number }[] } {
  const zone = ZONE_PRICES[plan.priceZone];
  const route =
    plan.priceZone === "same_city"
      ? plan.originWarehouse.city
      : `${plan.originWarehouse.city} → ${plan.destinationWarehouse.city}`;
  const breakdown = [{ label: `${zone.label} (${route})`, amount: zone.pkr }];
  if (prioritySurchargePKR > 0) breakdown.push({ label: "Priority surcharge", amount: prioritySurchargePKR });
  return { total: breakdown.reduce((sum, b) => sum + b.amount, 0), breakdown };
}

/** Warehouse whose city a claimable order starts in (customer pickup, or destination hub for the last mile). */
export function getOrderStartWarehouseId(order: Order): string {
  if (order.status === "at_destination_warehouse" && order.destinationWarehouseId) return order.destinationWarehouseId;
  return order.originWarehouseId || nearestWarehouse(order.pickupLocation).warehouse.id;
}

/** Shared notification inbox for riders of one city. */
export function cityRidersInbox(warehouseId: string): string {
  return `riders-${warehouseId}`;
}

/* =========================================================================
   WORKFLOW
   ========================================================================= */

export function getDeliveryType(order: Pick<Order, "deliveryType">): DeliveryType {
  return order.deliveryType === "intercity" ? "intercity" : "intracity";
}

export const WORKFLOW_STEPS: Record<DeliveryType, OrderStatus[]> = {
  intracity: ["pending", "accepted", "picked_up", "in_transit", "delivered"],
  intercity: [
    "pending",
    "accepted",
    "picked_up",
    "in_transit",
    "at_origin_warehouse",
    "linehaul",
    "at_destination_warehouse",
    "last_mile_accepted",
    "out_for_delivery",
    "delivered",
  ],
};

export interface Transition {
  to: OrderStatus;
  actor: "rider" | "admin";
  // When set, every listed party must confirm an emailed OTP before the move
  checkpoint?: VerificationCheckpoint;
  parties?: VerificationParty[];
  label: string;
}

const TRANSITIONS: Record<DeliveryType, Partial<Record<OrderStatus, Transition>>> = {
  intracity: {
    accepted: { to: "picked_up", actor: "rider", checkpoint: "pickup", parties: ["customer"], label: "Confirm pickup" },
    picked_up: { to: "in_transit", actor: "rider", label: "Start delivery ride" },
    in_transit: { to: "delivered", actor: "rider", checkpoint: "delivery", parties: ["customer"], label: "Confirm delivery" },
  },
  intercity: {
    accepted: { to: "picked_up", actor: "rider", checkpoint: "pickup", parties: ["customer"], label: "Confirm pickup" },
    picked_up: { to: "in_transit", actor: "rider", label: "Ride to warehouse" },
    in_transit: {
      to: "at_origin_warehouse",
      actor: "rider",
      checkpoint: "origin_warehouse",
      parties: ["customer", "admin"],
      label: "Hand over at warehouse",
    },
    at_origin_warehouse: { to: "linehaul", actor: "admin", label: "Dispatch to destination warehouse" },
    linehaul: { to: "at_destination_warehouse", actor: "admin", label: "Mark arrived at destination warehouse" },
    last_mile_accepted: {
      to: "out_for_delivery",
      actor: "rider",
      checkpoint: "warehouse_handover",
      parties: ["admin"],
      label: "Collect from warehouse",
    },
    out_for_delivery: { to: "delivered", actor: "rider", checkpoint: "delivery", parties: ["customer"], label: "Confirm delivery" },
  },
};

export function getNextTransition(order: Pick<Order, "status" | "deliveryType">): Transition | null {
  return TRANSITIONS[getDeliveryType(order)][order.status] || null;
}

/** Statuses a rider can claim from the nearby feed (first-mile and last-mile). */
export const CLAIMABLE_STATUSES: OrderStatus[] = ["pending", "at_destination_warehouse"];

/** Statuses during which a rider is on the move and sharing live location. */
export const RIDER_MOVING_STATUSES: OrderStatus[] = ["accepted", "picked_up", "in_transit", "last_mile_accepted", "out_for_delivery"];

/** Statuses where the order is still in progress (not pending, delivered or cancelled). */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "accepted",
  "picked_up",
  "in_transit",
  "at_origin_warehouse",
  "linehaul",
  "at_destination_warehouse",
  "last_mile_accepted",
  "out_for_delivery",
];

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/**
 * The leg currently being travelled. Maps, ETAs, distance in the rider feed and the live
 * location simulator all use this, so an intercity parcel is tracked hub to hub.
 */
export function getActiveLeg(order: Order): {
  from: GeoLocation;
  fromLabel: string;
  to: GeoLocation;
  toLabel: string;
  riderHeadingToStart: boolean; // rider is still on the way to `from`
} {
  const type = getDeliveryType(order);
  const originWh = getWarehouse(order.originWarehouseId);
  const destWh = getWarehouse(order.destinationWarehouseId);
  const pickup = { from: order.pickupLocation, fromLabel: order.pickupAddress };

  if (type === "intracity" || !originWh || !destWh) {
    return { ...pickup, to: order.deliveryLocation, toLabel: order.deliveryAddress, riderHeadingToStart: order.status === "accepted" };
  }

  switch (order.status) {
    case "pending":
    case "accepted":
    case "picked_up":
    case "in_transit":
      return { ...pickup, to: warehouseLocation(originWh), toLabel: originWh.name, riderHeadingToStart: order.status === "accepted" };
    case "at_origin_warehouse":
    case "linehaul":
      return { from: warehouseLocation(originWh), fromLabel: originWh.name, to: warehouseLocation(destWh), toLabel: destWh.name, riderHeadingToStart: false };
    default:
      return {
        from: warehouseLocation(destWh),
        fromLabel: destWh.name,
        to: order.deliveryLocation,
        toLabel: order.deliveryAddress,
        riderHeadingToStart: order.status === "at_destination_warehouse" || order.status === "last_mile_accepted",
      };
  }
}

export const CHECKPOINT_LABELS: Record<VerificationCheckpoint, string> = {
  pickup: "Pickup verification",
  origin_warehouse: "Origin warehouse drop-off",
  warehouse_handover: "Destination warehouse handover",
  delivery: "Delivery verification",
};
