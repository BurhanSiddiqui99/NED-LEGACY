import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./config";
import { MockStore } from "./mock-store";
import { AppUser, Rider, UserRole } from "@/types";

import { getFriendlyErrorMessage } from "./errors";

export interface RegisterCustomerData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

export interface RegisterRiderData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
  vehicleType: string;
  vehicleNumber: string;
}

export async function registerCustomer(data: RegisterCustomerData): Promise<AppUser> {
  const assignedRole: UserRole = data.role || "customer";

  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      const userProfile: AppUser = {
        uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: assignedRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      // Store user record and role directly in Firestore database
      await setDoc(doc(db, "users", uid), {
        uid: userProfile.uid,
        fullName: userProfile.fullName,
        email: userProfile.email,
        phone: userProfile.phone,
        role: assignedRole,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      MockStore.saveUser(userProfile);
      MockStore.setCurrentUser(userProfile);
      return userProfile;
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err);
      throw new Error(friendly);
    }
  }

  // Demo / local mode
  const uid = "usr-" + Math.random().toString(36).substring(2, 9);
  const userProfile: AppUser = {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: assignedRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
  MockStore.saveUser(userProfile);
  MockStore.setCurrentUser(userProfile);
  return userProfile;
}

export async function registerRider(data: RegisterRiderData): Promise<{ user: AppUser; rider: Rider }> {
  const assignedRole: UserRole = data.role || "rider";

  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      const userProfile: AppUser = {
        uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: assignedRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const riderProfile: Rider = {
        uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        isAvailable: true,
        isVerified: false,
        currentLocation: {
          latitude: 24.8532, // Default Saddar
          longitude: 67.0167,
        },
        completedDeliveries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in Firestore users collection with assigned role
      await setDoc(doc(db, "users", uid), {
        uid: userProfile.uid,
        fullName: userProfile.fullName,
        email: userProfile.email,
        phone: userProfile.phone,
        role: assignedRole,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Store in Firestore riders collection
      await setDoc(doc(db, "riders", uid), {
        uid: riderProfile.uid,
        fullName: riderProfile.fullName,
        email: riderProfile.email,
        phone: riderProfile.phone,
        role: assignedRole,
        vehicleType: riderProfile.vehicleType,
        vehicleNumber: riderProfile.vehicleNumber,
        isAvailable: riderProfile.isAvailable,
        isVerified: riderProfile.isVerified,
        currentLocation: riderProfile.currentLocation,
        completedDeliveries: riderProfile.completedDeliveries,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      MockStore.saveUser(userProfile);
      MockStore.saveRider(riderProfile);
      MockStore.setCurrentUser(userProfile);
      return { user: userProfile, rider: riderProfile };
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err);
      throw new Error(friendly);
    }
  }

  // Demo / local mode
  const uid = "rdr-" + Math.random().toString(36).substring(2, 9);
  const userProfile: AppUser = {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: assignedRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
  const riderProfile: Rider = {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    vehicleType: data.vehicleType,
    vehicleNumber: data.vehicleNumber,
    isAvailable: true,
    isVerified: true,
    currentLocation: {
      latitude: 24.9322, // NED University
      longitude: 67.1128,
    },
    completedDeliveries: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MockStore.saveUser(userProfile);
  MockStore.saveRider(riderProfile);
  MockStore.setCurrentUser(userProfile);
  return { user: userProfile, rider: riderProfile };
}

export async function loginUser(email: string, password?: string): Promise<AppUser> {
  const lowerEmail = email.toLowerCase().trim();

  // If Firebase is configured with real credentials, perform real Firebase Auth
  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password || "");
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (!userDoc.exists()) {
        throw new Error("User record not found in Firestore database. Please register first.");
      }
      const data = userDoc.data() as AppUser;
      MockStore.setCurrentUser(data);
      return data;
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err);
      throw new Error(friendly);
    }
  }

  // Fallback for offline/local mode when Firebase keys have not yet been provided
  const matchedUser = MockStore.getUsers().find((u) => u.email.toLowerCase() === lowerEmail);
  if (matchedUser) {
    MockStore.setCurrentUser(matchedUser);
    return matchedUser;
  }

  throw new Error("Invalid email or password.");
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut warning:", e);
    }
  }
  MockStore.setCurrentUser(null);
}

export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await sendPasswordResetEmail(auth, email);
      return;
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err);
      throw new Error(friendly);
    }
  }
  // Mock mode
  const user = MockStore.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("No user found with that email address.");
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  if (isFirebaseConfigured && db) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return (userDoc.data() as AppUser).role;
    }
  }
  const user = MockStore.getUser(uid);
  return user ? user.role : null;
}
