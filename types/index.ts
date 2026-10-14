import { Timestamp } from "firebase/firestore";

export type UserRole = "customer" | "rider" | "admin";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  createdAt: Timestamp | string | number | Date;
  updatedAt: Timestamp | string | number | Date;
  isActive: boolean;
}

export interface Rider {
  uid: string;
  fullName?: string;
  email?: string;
  phone?: string;
  vehicleType: string;
  vehicleNumber: string;
  // Home city: the rider only sees jobs that start at this city's warehouse
  city?: string;
  warehouseId?: string;
  isAvailable: boolean;
  isVerified: boolean;
  currentLocation: GeoLocation;
  completedDeliveries: number;
  createdAt: Timestamp | string | number | Date;
  updatedAt: Timestamp | string | number | Date;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "in_transit"
  // Intercity only: parcel moves through a warehouse in each city
  | "at_origin_warehouse"
  | "linehaul"
  | "at_destination_warehouse"
  | "last_mile_accepted"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/** intracity: one rider, door to door. intercity: rider -> origin warehouse -> destination warehouse -> rider. */
export type DeliveryType = "intracity" | "intercity";

/** Points in the workflow that need an emailed OTP before the status can move on. */
export type VerificationCheckpoint = "pickup" | "origin_warehouse" | "warehouse_handover" | "delivery";

export type VerificationParty = "customer" | "admin";

export interface OtpChallenge {
  // Server-signed HMAC of the code; the code itself is never stored
  token: string;
  sentTo: string; // masked email
  sentAt: string;
  expiresAt: number;
}

export interface VerificationRecord {
  challenges?: Partial<Record<VerificationParty, OtpChallenge>>;
  verifiedBy?: Partial<Record<VerificationParty, string>>; // ISO time each party's code was confirmed
  completedAt?: string;
}

export interface RiderRejection {
  riderId: string;
  riderName: string;
  reason: string;
  at: string;
  leg: "first_mile" | "last_mile";
}

export interface Warehouse {
  id: string;
  city: string;
  province: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  // Addresses within this radius belong to this warehouse's city
  serviceRadiusKm: number;
  capacityParcels: number;
}

export type OrderPriority = "normal" | "high" | "urgent";

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  riderId: string | null;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;

  pickupAddress: string;
  deliveryAddress: string;

  pickupLocation: GeoLocation;
  deliveryLocation: GeoLocation;

  recipientName: string;
  recipientPhone: string;

  packageDescription: string;
  packageWeight?: number;
  deliveryInstructions?: string;

  status: OrderStatus;
  priority?: OrderPriority;

  // Routing between cities (orders created before this feature are treated as intracity)
  deliveryType?: DeliveryType;
  originCity?: string;
  destinationCity?: string;
  originWarehouseId?: string;
  destinationWarehouseId?: string;
  customerEmail?: string;

  // Every rider who has held this order (first-mile and last-mile), for "My Deliveries"
  riderIds?: string[];
  firstMileRiderId?: string | null;
  firstMileRiderName?: string;

  rejectedBy?: string[];
  rejections?: RiderRejection[];

  verifications?: Partial<Record<VerificationCheckpoint, VerificationRecord>>;
  // Status change log for the timeline
  statusHistory?: { status: OrderStatus; at: string; by?: string }[];
  fareBreakdown?: { label: string; amount: number }[];
  priceZone?: "same_city" | "same_province" | "inter_province";

  // Live courier telemetry, written by the assigned rider's device
  currentRiderLocation?: GeoLocation | null;
  riderLocationUpdatedAt?: Timestamp | string | number | Date | null;

  createdAt: Timestamp | string | number | Date;
  updatedAt: Timestamp | string | number | Date;
  acceptedAt?: Timestamp | string | number | Date | null;
  deliveredAt?: Timestamp | string | number | Date | null;
  estimatedDeliveryTime?: string;
  price?: number;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName?: string;
  senderRole?: "customer" | "rider" | "admin";
  receiverId: string;
  text: string;
  createdAt: Timestamp | string | number | Date;
  isRead: boolean;
}

export type NotificationType =
  | "order_rejected"
  | "verification"
  | "order_created"
  | "order_accepted"
  | "status_updated"
  | "new_message"
  | "delivery_completed"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  isRead: boolean;
  createdAt: Timestamp | string | number | Date;
}

export interface LocationPreset {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
  city: string;
}
