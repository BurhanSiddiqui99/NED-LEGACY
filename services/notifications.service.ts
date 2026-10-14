import {
  createNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/firebase/firestore";
import { AppNotification } from "@/types";

export const notificationsService = {
  async create(notif: Omit<AppNotification, "id" | "isRead" | "createdAt">) {
    return createNotification(notif);
  },

  subscribe(userId: string, callback: (notifications: AppNotification[]) => void) {
    return subscribeToNotifications(userId, callback);
  },

  async markAsRead(notificationId: string) {
    return markNotificationAsRead(notificationId);
  },

  async markAllAsRead(userId: string) {
    return markAllNotificationsAsRead(userId);
  },
};
