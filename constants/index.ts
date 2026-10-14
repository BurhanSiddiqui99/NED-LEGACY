import { LocationPreset, OrderPriority, OrderStatus, UserRole } from "@/types";

export const PAKISTAN_LOCATIONS: LocationPreset[] = [
  // Karachi
  {
    id: "ned-uni",
    name: "NED University of Engineering & Tech",
    address: "Main University Road, Block 1, Gulshan-e-Iqbal, Karachi",
    latitude: 24.9322,
    longitude: 67.1128,
    area: "Gulshan-e-Iqbal",
    city: "Karachi",
  },
  {
    id: "saddar",
    name: "Saddar Downtown & Electronics Market",
    address: "Abdullah Haroon Road, Saddar, Karachi",
    latitude: 24.8532,
    longitude: 67.0167,
    area: "Saddar",
    city: "Karachi",
  },
  {
    id: "clifton",
    name: "Clifton Block 4 & Sea View",
    address: "Clifton Beach Avenue, Block 4, Clifton, Karachi",
    latitude: 24.8138,
    longitude: 67.0299,
    area: "Clifton",
    city: "Karachi",
  },
  {
    id: "gulshan",
    name: "Gulshan-e-Iqbal Block 13-D",
    address: "University Road opposite Expo Centre, Gulshan-e-Iqbal, Karachi",
    latitude: 24.9207,
    longitude: 67.0982,
    area: "Gulshan-e-Iqbal",
    city: "Karachi",
  },
  {
    id: "north-nazimabad",
    name: "North Nazimabad Hyderi Market",
    address: "Block H, Hyderi Market, North Nazimabad, Karachi",
    latitude: 24.9392,
    longitude: 67.0425,
    area: "North Nazimabad",
    city: "Karachi",
  },
  {
    id: "dha-phase6",
    name: "DHA Phase 6 Commercial Area",
    address: "Khayaban-e-Bukhari, Phase 6, DHA, Karachi",
    latitude: 24.8055,
    longitude: 67.062,
    area: "DHA",
    city: "Karachi",
  },
  {
    id: "pechs",
    name: "PECHS Block 2 / Tariq Road",
    address: "Tariq Road Shopping District, PECHS Block 2, Karachi",
    latitude: 24.8716,
    longitude: 67.0658,
    area: "PECHS",
    city: "Karachi",
  },
  {
    id: "korangi",
    name: "Korangi Industrial Park",
    address: "Sector 23, Korangi Industrial Area, Karachi",
    latitude: 24.8387,
    longitude: 67.1205,
    area: "Korangi",
    city: "Karachi",
  },
  {
    id: "johar",
    name: "Gulistan-e-Johar Chowrangi",
    address: "Block 15, Johar Chowrangi, Gulistan-e-Johar, Karachi",
    latitude: 24.918,
    longitude: 67.135,
    area: "Gulistan-e-Johar",
    city: "Karachi",
  },
  // Lahore
  {
    id: "lahore-liberty",
    name: "Liberty Market, Gulberg",
    address: "Liberty Market, Gulberg III, Lahore",
    latitude: 31.5104,
    longitude: 74.3416,
    area: "Gulberg",
    city: "Lahore",
  },
  {
    id: "lahore-mall-road",
    name: "Mall Road / Anarkali",
    address: "The Mall Road near Anarkali Bazaar, Lahore",
    latitude: 31.5656,
    longitude: 74.3142,
    area: "Anarkali",
    city: "Lahore",
  },
  // Islamabad / Rawalpindi
  {
    id: "isb-blue-area",
    name: "Blue Area, Jinnah Avenue",
    address: "Jinnah Avenue, Blue Area, Islamabad",
    latitude: 33.7104,
    longitude: 73.0587,
    area: "Blue Area",
    city: "Islamabad",
  },
  {
    id: "isb-f6",
    name: "F-6 Super Market",
    address: "Super Market, F-6 Markaz, Islamabad",
    latitude: 33.7294,
    longitude: 73.0768,
    area: "F-6",
    city: "Islamabad",
  },
  {
    id: "rwp-saddar",
    name: "Saddar Rawalpindi",
    address: "Bank Road, Saddar, Rawalpindi",
    latitude: 33.5973,
    longitude: 73.0479,
    area: "Saddar",
    city: "Rawalpindi",
  },
  // Other major cities
  {
    id: "fsd-clock-tower",
    name: "Clock Tower, Faisalabad",
    address: "Ghanta Ghar Chowk, Faisalabad",
    latitude: 31.4187,
    longitude: 73.0791,
    area: "City Centre",
    city: "Faisalabad",
  },
  {
    id: "multan-cantt",
    name: "Multan Cantt",
    address: "Multan Cantonment, Multan",
    latitude: 30.1864,
    longitude: 71.4486,
    area: "Cantt",
    city: "Multan",
  },
  {
    id: "peshawar-saddar",
    name: "Saddar Peshawar",
    address: "Saddar Road, Peshawar Cantt, Peshawar",
    latitude: 34.0003,
    longitude: 71.5428,
    area: "Saddar",
    city: "Peshawar",
  },
  {
    id: "quetta-jinnah-road",
    name: "Jinnah Road, Quetta",
    address: "Jinnah Road, Quetta",
    latitude: 30.1916,
    longitude: 67.0044,
    area: "City Centre",
    city: "Quetta",
  },
  {
    id: "hyd-autobhan",
    name: "Auto Bhan Road, Hyderabad",
    address: "Auto Bhan Road, Latifabad, Hyderabad",
    latitude: 25.3792,
    longitude: 68.3683,
    area: "Latifabad",
    city: "Hyderabad",
  },
  {
    id: "sialkot-cantt",
    name: "Sialkot Cantt",
    address: "Paris Road, Sialkot Cantt, Sialkot",
    latitude: 32.5101,
    longitude: 74.5404,
    area: "Cantt",
    city: "Sialkot",
  },
];

export const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    icon: string;
    bgLight: string;
    textLight: string;
    borderLight: string;
  }
> = {
  pending: {
    label: "Pending",
    description: "Searching for nearby available rider",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    icon: "Clock",
    bgLight: "#FEF3C7",
    textLight: "#92400E",
    borderLight: "#FCD34D",
  },
  accepted: {
    label: "Accepted",
    description: "Rider assigned and en route to pickup",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    icon: "CheckCircle2",
    bgLight: "#DBEAFE",
    textLight: "#1E40AF",
    borderLight: "#93C5FD",
  },
  picked_up: {
    label: "Picked Up",
    description: "Package received by rider from sender",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    icon: "PackageCheck",
    bgLight: "#F3E8FF",
    textLight: "#6B21A8",
    borderLight: "#D8B4FE",
  },
  in_transit: {
    label: "In Transit",
    description: "Out for delivery to destination",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    icon: "Truck",
    bgLight: "#CCFBF1",
    textLight: "#115E59",
    borderLight: "#5EEAD4",
  },
  delivered: {
    label: "Delivered",
    description: "Package successfully handed over to recipient",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    icon: "BadgeCheck",
    bgLight: "#D1FAE5",
    textLight: "#065F46",
    borderLight: "#6EE7B7",
  },
  cancelled: {
    label: "Cancelled",
    description: "Delivery request cancelled",
    badgeClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    icon: "XCircle",
    bgLight: "#FEE2E2",
    textLight: "#991B1B",
    borderLight: "#FCA5A5",
  },
};

/* =========================================================================
   DAY 2: PRIORITY DELIVERY SYSTEM
   ========================================================================= */

export const PRIORITY_LEVELS: OrderPriority[] = ["normal", "high", "urgent"];

export const PRIORITY_CONFIG: Record<
  OrderPriority,
  {
    label: string;
    description: string;
    badgeClass: string;
    cardClass: string;
    rowClass: string;
    // Extra fee charged to the customer for faster handling
    surchargePKR: number;
    // Distance divisor used for the rider decision score (higher = more attractive)
    weight: number;
    rank: number;
  }
> = {
  normal: {
    label: "Normal",
    description: "Standard delivery queue",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    cardClass: "",
    rowClass: "",
    surchargePKR: 0,
    weight: 1,
    rank: 0,
  },
  high: {
    label: "High",
    description: "Picked before normal orders",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700",
    cardClass: "ring-2 ring-orange-400/70 dark:ring-orange-500/60",
    rowClass: "bg-orange-50/70 dark:bg-orange-950/20 border-l-4 border-l-orange-400",
    surchargePKR: 100,
    weight: 1.6,
    rank: 1,
  },
  urgent: {
    label: "Urgent",
    description: "Immediate pickup, top of every queue",
    badgeClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700",
    cardClass: "ring-2 ring-red-500/80 dark:ring-red-500/70 shadow-red-500/20 shadow-lg",
    rowClass: "bg-red-50/70 dark:bg-red-950/20 border-l-4 border-l-red-500",
    surchargePKR: 250,
    weight: 2.5,
    rank: 2,
  },
};

/** Orders created before Day 2 have no priority field; they are treated as Normal. */
export function getOrderPriority(order: { priority?: OrderPriority | null }): OrderPriority {
  return order.priority && order.priority in PRIORITY_CONFIG ? order.priority : "normal";
}

/**
 * Rider decision score: effective distance in km after priority weighting.
 * Lower is better. An URGENT order 2.5 km away scores the same as a NORMAL order 1 km away.
 */
export function getPriorityScore(distanceKm: number, priority: OrderPriority): number {
  return distanceKm / PRIORITY_CONFIG[priority].weight;
}

/** Rider position is only shown while a rider is assigned and the parcel is moving. */
export function isTrackable(order: { riderId?: string | null; status: OrderStatus }): boolean {
  return Boolean(order.riderId) && ["accepted", "picked_up", "in_transit"].includes(order.status);
}

export const NEXT_ALLOWED_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const DEMO_ACCOUNTS = [
  {
    role: "customer" as UserRole,
    title: "Demo Customer",
    email: "customer@logipulse.demo",
    password: "demoPassword123!",
    name: "Ayesha Khan (Customer)",
    phone: "+92 300 1234567",
    badge: "Customer Account",
    desc: "Post parcel deliveries across Pakistan, track live riders, and chat.",
  },
  {
    role: "rider" as UserRole,
    title: "Demo Delivery Rider",
    email: "rider@logipulse.demo",
    password: "demoPassword123!",
    name: "Tariq Mahmood (Rider)",
    phone: "+92 321 7654321",
    vehicleType: "Honda CD 70 Motorcycle",
    vehicleNumber: "KHI-KAS-4821",
    badge: "Verified Rider",
    desc: "Browse nearby orders, accept assignments, update delivery milestones.",
  },
  {
    role: "admin" as UserRole,
    title: "Logistics Operations Admin",
    email: "admin@logipulse.demo",
    password: "demoPassword123!",
    name: "Burhan Siddiqui (Admin)",
    phone: "+92 333 9876543",
    badge: "Logistics Master Admin",
    desc: "Monitor all fleet metrics, verify riders, view system-wide analytics.",
  },
];
