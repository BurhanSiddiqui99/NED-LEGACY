import {
  createNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/firebase/firestore";
import { AppNotification, UserRole } from "@/types";

export const notificationsService = {
  async create(notif: Omit<AppNotification, "id" | "isRead" | "createdAt">) {
    return createNotification(notif);
  },

  subscribe(
    userId: string,
    role: UserRole | null | undefined,
    callback: (notifications: AppNotification[]) => void,
    riderWarehouseId?: string | null
  ) {
    return subscribeToNotifications(userId, role, callback, riderWarehouseId);
  },

  async markAsRead(notificationId: string) {
    return markNotificationAsRead(notificationId);
  },

  async markAllAsRead(userId: string, role?: UserRole | null, riderWarehouseId?: string | null) {
    return markAllNotificationsAsRead(userId, role, riderWarehouseId);
  },
};
