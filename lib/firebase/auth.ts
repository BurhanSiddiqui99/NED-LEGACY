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

export interface RegisterCustomerData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterRiderData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
}

export async function registerCustomer(data: RegisterCustomerData): Promise<AppUser> {
  if (isFirebaseConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = cred.user.uid;

    const userProfile: AppUser = {
      uid,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: "customer",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true,
    };

    await setDoc(doc(db, "users", uid), userProfile);
    return userProfile;
  }

  // Demo / local mode
  const uid = "usr-" + Math.random().toString(36).substring(2, 9);
  const userProfile: AppUser = {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: "customer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
  MockStore.saveUser(userProfile);
  MockStore.setCurrentUser(userProfile);
  return userProfile;
}

export async function registerRider(data: RegisterRiderData): Promise<{ user: AppUser; rider: Rider }> {
  if (isFirebaseConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = cred.user.uid;

    const userProfile: AppUser = {
      uid,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: "rider",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
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
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, "users", uid), userProfile);
    await setDoc(doc(db, "riders", uid), riderProfile);
    return { user: userProfile, rider: riderProfile };
  }

  // Demo / local mode
  const uid = "rdr-" + Math.random().toString(36).substring(2, 9);
  const userProfile: AppUser = {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: "rider",
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
    const cred = await signInWithEmailAndPassword(auth, email, password || "");
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!userDoc.exists()) {
      throw new Error("User record not found in Firestore database.");
    }
    const data = userDoc.data() as AppUser;
    MockStore.setCurrentUser(data);
    return data;
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
    await sendPasswordResetEmail(auth, email);
    return;
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
