import { AppNotification, AppUser, Message, Order, Rider, UserRole } from "@/types";
import { KARACHI_LOCATIONS } from "@/constants";

const STORAGE_KEYS = {
  USERS: "logipulse_mock_users",
  RIDERS: "logipulse_mock_riders",
  ORDERS: "logipulse_mock_orders",
  MESSAGES: "logipulse_mock_messages",
  NOTIFICATIONS: "logipulse_mock_notifications",
  AUTH_CURRENT: "logipulse_mock_current_user",
};

// Seed data
const INITIAL_USERS: AppUser[] = [
  {
    uid: "demo-customer-uid",
    fullName: "Ayesha Khan",
    email: "customer@logipulse.demo",
    phone: "+92 300 1234567",
    role: "customer",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: "demo-rider-uid",
    fullName: "Tariq Mahmood",
    email: "rider@logipulse.demo",
    phone: "+92 321 7654321",
    role: "rider",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: "demo-admin-uid",
    fullName: "Burhan Siddiqui",
    email: "admin@logipulse.demo",
    phone: "+92 333 9876543",
    role: "admin",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
];

const INITIAL_RIDERS: Rider[] = [
  {
    uid: "demo-rider-uid",
    fullName: "Tariq Mahmood",
    email: "rider@logipulse.demo",
    phone: "+92 321 7654321",
    vehicleType: "Honda CD 70 Motorcycle",
    vehicleNumber: "KHI-KAS-4821",
    isAvailable: true,
    isVerified: true,
    currentLocation: {
      latitude: KARACHI_LOCATIONS[0].latitude, // NED University
      longitude: KARACHI_LOCATIONS[0].longitude,
    },
    completedDeliveries: 42,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "LP-98214",
    customerId: "demo-customer-uid",
    customerName: "Ayesha Khan",
    customerPhone: "+92 300 1234567",
    riderId: null,
    pickupAddress: "Main University Road, Block 1, Gulshan-e-Iqbal, Karachi",
    deliveryAddress: "Abdullah Haroon Road, Saddar, Karachi",
    pickupLocation: {
      latitude: 24.9322,
      longitude: 67.1128,
    },
    deliveryLocation: {
      latitude: 24.8532,
      longitude: 67.0167,
    },
    recipientName: "Zubair Ahmed",
    recipientPhone: "+92 312 8899001",
    packageDescription: "Confidential Legal Documents & University Certificates (sealed envelope)",
    packageWeight: 0.8,
    deliveryInstructions: "Please call on arrival and deliver to 2nd Floor office.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    price: 350,
  },
  {
    id: "LP-84720",
    customerId: "demo-customer-uid",
    customerName: "Ayesha Khan",
    customerPhone: "+92 300 1234567",
    riderId: "demo-rider-uid",
    riderName: "Tariq Mahmood",
    riderPhone: "+92 321 7654321",
    riderVehicle: "Honda CD 70 (KHI-KAS-4821)",
    pickupAddress: "Khayaban-e-Bukhari, Phase 6, DHA, Karachi",
    deliveryAddress: "Tariq Road Shopping District, PECHS Block 2, Karachi",
    pickupLocation: {
      latitude: 24.8055,
      longitude: 67.062,
    },
    deliveryLocation: {
      latitude: 24.8716,
      longitude: 67.0658,
    },
    recipientName: "Fatima Noor",
    recipientPhone: "+92 345 5566778",
    packageDescription: "Artisan Bakery Parcel (Delicate Glassware Box)",
    packageWeight: 2.2,
    deliveryInstructions: "Handle with care, delicate fragile contents.",
    status: "in_transit",
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    acceptedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    price: 520,
  },
  {
    id: "LP-73190",
    customerId: "demo-customer-uid",
    customerName: "Ayesha Khan",
    customerPhone: "+92 300 1234567",
    riderId: "demo-rider-uid",
    riderName: "Tariq Mahmood",
    riderPhone: "+92 321 7654321",
    riderVehicle: "Honda CD 70 (KHI-KAS-4821)",
    pickupAddress: "Clifton Beach Avenue, Block 4, Clifton, Karachi",
    deliveryAddress: "Sector 23, Korangi Industrial Area, Karachi",
    pickupLocation: {
      latitude: 24.8138,
      longitude: 67.0299,
    },
    deliveryLocation: {
      latitude: 24.8387,
      longitude: 67.1205,
    },
    recipientName: "Hamza Farooq",
    recipientPhone: "+92 334 2233445",
    packageDescription: "Spare Mechanical Hardware Components",
    packageWeight: 4.5,
    deliveryInstructions: "Gate security entrance at Factory 4B.",
    status: "delivered",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2 + 1000 * 60 * 90).toISOString(),
    acceptedAt: new Date(Date.now() - 86400000 * 2 + 1000 * 60 * 15).toISOString(),
    deliveredAt: new Date(Date.now() - 86400000 * 2 + 1000 * 60 * 90).toISOString(),
    price: 780,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-101",
    orderId: "LP-84720",
    senderId: "demo-rider-uid",
    senderName: "Tariq Mahmood",
    receiverId: "demo-customer-uid",
    text: "As-salamu alaykum! I have picked up your bakery parcel and ensured secure strapping. On my way towards Tariq Road.",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: true,
  },
  {
    id: "msg-102",
    orderId: "LP-84720",
    senderId: "demo-customer-uid",
    senderName: "Ayesha Khan",
    receiverId: "demo-rider-uid",
    text: "Walaikum as-salam Tariq Bhai, thank you so much! Please drive safely.",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    isRead: true,
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "demo-customer-uid",
    title: "Order In Transit",
    message: "Rider Tariq Mahmood is en route with your package #LP-84720.",
    type: "status_updated",
    orderId: "LP-84720",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "notif-2",
    userId: "demo-rider-uid",
    title: "New Nearby Delivery Available",
    message: "A new delivery request #LP-98214 was posted near NED University Campus.",
    type: "order_created",
    orderId: "LP-98214",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
];

type ListenerCallback = () => void;
const listeners: Set<ListenerCallback> = new Set();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("Listener error:", e);
    }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error("Error setting item in localStorage", e);
  }
}

export const MockStore = {
  init() {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RIDERS)) {
      localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(INITIAL_RIDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    window.addEventListener("storage", () => {
      notifyListeners();
    });
  },

  subscribe(cb: ListenerCallback): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },

  // Users
  getUsers(): AppUser[] {
    return getItem<AppUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  getUser(uid: string): AppUser | null {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid) || null;
  },
  saveUser(user: AppUser) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push(user);
    }
    setItem(STORAGE_KEYS.USERS, users);
  },

  // Current Auth session
  getCurrentUser(): AppUser | null {
    return getItem<AppUser | null>(STORAGE_KEYS.AUTH_CURRENT, null);
  },
  setCurrentUser(user: AppUser | null) {
    setItem(STORAGE_KEYS.AUTH_CURRENT, user);
  },

  // Riders
  getRiders(): Rider[] {
    return getItem<Rider[]>(STORAGE_KEYS.RIDERS, INITIAL_RIDERS);
  },
  getRider(uid: string): Rider | null {
    const riders = this.getRiders();
    return riders.find((r) => r.uid === uid) || null;
  },
  saveRider(rider: Rider) {
    const riders = this.getRiders();
    const idx = riders.findIndex((r) => r.uid === rider.uid);
    if (idx >= 0) {
      riders[idx] = { ...riders[idx], ...rider, updatedAt: new Date().toISOString() };
    } else {
      riders.push(rider);
    }
    setItem(STORAGE_KEYS.RIDERS, riders);
  },

  // Orders
  getOrders(): Order[] {
    return getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  getOrder(orderId: string): Order | null {
    const orders = this.getOrders();
    return orders.find((o) => o.id === orderId) || null;
  },
  saveOrder(order: Order) {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...order, updatedAt: new Date().toISOString() };
    } else {
      orders.unshift(order);
    }
    setItem(STORAGE_KEYS.ORDERS, orders);
  },

  // Messages
  getMessages(orderId?: string): Message[] {
    const msgs = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    if (orderId) {
      return msgs.filter((m) => m.orderId === orderId);
    }
    return msgs;
  },
  addMessage(msg: Message) {
    const msgs = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    msgs.push(msg);
    setItem(STORAGE_KEYS.MESSAGES, msgs);
  },

  // Notifications
  getNotifications(userId?: string): AppNotification[] {
    const notifs = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (userId) {
      return notifs.filter((n) => n.userId === userId);
    }
    return notifs;
  },
  addNotification(notif: AppNotification) {
    const notifs = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    notifs.unshift(notif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  markNotificationRead(notificationId: string) {
    const notifs = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },
  markAllNotificationsRead(userId: string) {
    const notifs = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  resetDefaults() {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(INITIAL_RIDERS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    notifyListeners();
  },
};
