import { getFirebaseMessaging, isFirebaseConfigured } from "./config";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    if (!isFirebaseConfigured) {
      toast.info("In-app notifications enabled! (Demo mode)");
      return "demo-fcm-token";
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (error) {
    console.warn("Error getting notification token:", error);
    return null;
  }
}

export function setupForegroundMessageListener(onNotificationReceived?: (payload: any) => void) {
  if (typeof window === "undefined") return () => {};

  let unsubscribe = () => {};

  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;
    try {
      unsubscribe = onMessage(messaging, (payload) => {
        if (payload.notification) {
          toast(payload.notification.title || "LogiPulse Alert", {
            description: payload.notification.body,
          });
        }
        if (onNotificationReceived) {
          onNotificationReceived(payload);
        }
      });
    } catch (err) {
      console.warn("Foreground message listener not established:", err);
    }
  });

  return unsubscribe;
}
