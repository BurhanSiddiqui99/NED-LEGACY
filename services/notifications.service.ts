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
    callback: (notifications: AppNotification[]) => void
  ) {
    return subscribeToNotifications(userId, role, callback);
  },

  async markAsRead(notificationId: string) {
    return markNotificationAsRead(notificationId);
  },

  async markAllAsRead(userId: string, role?: UserRole | null) {
    return markAllNotificationsAsRead(userId, role);
  },
};
