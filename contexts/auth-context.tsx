"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/config";
import { authService } from "@/services/auth.service";
import { ridersService } from "@/services/riders.service";
import { MockStore } from "@/lib/firebase/mock-store";
import { AppUser, Rider, UserRole } from "@/types";
import { DEMO_ACCOUNTS } from "@/constants";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { subscribeToRiderProfile } from "@/lib/firebase/firestore";
import { nearestWarehouse } from "@/lib/logistics";

interface AuthContextType {
  user: AppUser | null;
  riderProfile: Rider | null;
  // Rider's home city warehouse (riders only)
  riderWarehouseId: string | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password?: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  registerCustomer: (data: any) => Promise<AppUser>;
  registerRider: (data: any) => Promise<any>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateRiderAvailability: (isAvailable: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [riderProfile, setRiderProfile] = useState<Rider | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize store if in browser
  useEffect(() => {
    MockStore.init();
  }, []);

  // Uid whose profile is already loaded, so the auth listener does not refetch it right after login()
  const loadedUidRef = useRef<string | null>(null);

  // Rider profile is a live subscription so availability, location and delivery count stay current
  useEffect(() => {
    if (!user || user.role !== "rider") {
      setRiderProfile(null);
      return;
    }
    return subscribeToRiderProfile(user.uid, setRiderProfile);
  }, [user?.uid, user?.role]);

  // Fetch or sync user and role
  const syncUserData = async (currentUid?: string) => {
    if (!currentUid) {
      setUser(null);
      setRiderProfile(null);
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        const userDoc = await getDoc(doc(db, "users", currentUid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          setUser(userData);
          loadedUidRef.current = userData.uid;
          MockStore.setCurrentUser(userData);
        }
      } else {
        const mockUser = MockStore.getUser(currentUid);
        setUser(mockUser);
      }
    } catch (err) {
      console.error("Error syncing user data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeAuth = () => {};

    if (isFirebaseConfigured && auth) {
      // Render instantly with the cached profile from the last session; Firebase confirms it below
      const cached = MockStore.getCurrentUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }

      unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          if (loadedUidRef.current === fbUser.uid) {
            setLoading(false);
            return;
          }
          await syncUserData(fbUser.uid);
        } else {
          loadedUidRef.current = null;
          MockStore.setCurrentUser(null);
          setUser(null);
          setRiderProfile(null);
          setLoading(false);
        }
      });
    } else {
      // Local session check: only restore if a user explicitly signed in
      const current = MockStore.getCurrentUser();
      if (current) {
        setUser(current);
      } else {
        setUser(null);
        setRiderProfile(null);
      }
      setLoading(false);
    }

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // No global loading flag here: the login form shows its own progress, and flipping the
  // shared flag would make every RoleGuard flash a full-screen spinner during navigation.
  const login = async (email: string, password?: string): Promise<AppUser> => {
    try {
      const loggedIn = await authService.login(email, password);
      loadedUidRef.current = loggedIn.uid;
      setUser(loggedIn);
      setLoading(false);
      toast.success(`Welcome back, ${loggedIn.fullName}!`);
      return loggedIn;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    // Clear local state first so every screen stops rendering user data immediately
    loadedUidRef.current = null;
    setUser(null);
    setRiderProfile(null);
    MockStore.setCurrentUser(null);
    try {
      await authService.logout();
      toast.info("You have been signed out.");
    } catch (err: any) {
      toast.error(err?.message || "Sign out failed");
    }
  };

  const registerCustomer = async (data: any): Promise<AppUser> => {
    setLoading(true);
    try {
      const newUser = await authService.registerCustomer(data);
      loadedUidRef.current = newUser.uid;
      setUser(newUser);
      toast.success("Account registered successfully!");
      return newUser;
    } catch (error: any) {
      toast.error(error.message || "Failed to register account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerRider = async (data: any): Promise<any> => {
    setLoading(true);
    try {
      const res = await authService.registerRider(data);
      loadedUidRef.current = res.user.uid;
      setUser(res.user);
      setRiderProfile(res.rider);
      toast.success("Rider partner account registered successfully!");
      return res;
    } catch (error: any) {
      toast.error(error.message || "Failed to register rider account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (targetRole: UserRole): Promise<void> => {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === targetRole);
    if (!demo) return;

    setLoading(true);
    try {
      const demoUser = await authService.login(demo.email, demo.password);
      loadedUidRef.current = demoUser.uid;
      setUser(demoUser);
      toast.success(`Active user: ${demo.title}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (user) {
      await syncUserData(user.uid);
    }
  };

  const updateRiderAvailability = async (isAvailable: boolean): Promise<void> => {
    if (!user || user.role !== "rider") return;
    try {
      await ridersService.updateAvailability(user.uid, isAvailable);
      // Optimistic; the live rider listener confirms it
      if (riderProfile) {
        setRiderProfile({ ...riderProfile, isAvailable });
      }
      toast.success(`Rider status: ${isAvailable ? "Available" : "Unavailable"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update availability");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        riderProfile,
        // Registered home city; riders created before cities existed fall back to their GPS city
        riderWarehouseId:
          riderProfile?.warehouseId ||
          (riderProfile?.currentLocation ? nearestWarehouse(riderProfile.currentLocation).warehouse.id : null),
        role: user?.role || null,
        loading,
        isConfigured: isFirebaseConfigured,
        login,
        logout,
        registerCustomer,
        registerRider,
        switchDemoRole,
        refreshUser,
        updateRiderAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
