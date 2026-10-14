import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, Messaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.projectId !== "your-project-id" &&
    !firebaseConfig.apiKey.includes("your_")
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

if (typeof window !== "undefined" || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      // Initialize analytics in browser if supported
      if (typeof window !== "undefined" && firebaseConfig.measurementId) {
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && app) {
              analytics = getAnalytics(app);
            }
          })
          .catch((err) => console.warn("Firebase Analytics not initialized:", err));
      }
    }
  } catch (error) {
    console.warn("LogiPulse: Firebase initialization warning:", error);
  }
}

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined" || !app) return null;
  try {
    const supported = await isMessagingSupported();
    if (supported && !messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (err) {
    console.warn("FCM not supported in this browser context:", err);
    return null;
  }
};

export { app, auth, db, analytics };
