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
  | "delivered"
  | "cancelled";

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
  receiverId: string;
  text: string;
  createdAt: Timestamp | string | number | Date;
  isRead: boolean;
}

export type NotificationType =
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

export interface KarachiLocationPreset {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
}
