"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/config";
import { authService } from "@/services/auth.service";
import { ridersService } from "@/services/riders.service";
import { MockStore } from "@/lib/firebase/mock-store";
import { AppUser, Rider, UserRole } from "@/types";
import { DEMO_ACCOUNTS } from "@/constants";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface AuthContextType {
  user: AppUser | null;
  riderProfile: Rider | null;
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

          if (userData.role === "rider") {
            const riderDoc = await getDoc(doc(db, "riders", currentUid));
            if (riderDoc.exists()) {
              const rData = riderDoc.data() as Rider;
              setRiderProfile(rData);
            }
          }
        }
      } else {
        const mockUser = MockStore.getUser(currentUid);
        setUser(mockUser);
        if (mockUser?.role === "rider") {
          setRiderProfile(MockStore.getRider(mockUser.uid));
        }
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
      unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          await syncUserData(fbUser.uid);
        } else {
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
        if (current.role === "rider") {
          setRiderProfile(MockStore.getRider(current.uid));
        }
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

  const login = async (email: string, password?: string): Promise<AppUser> => {
    setLoading(true);
    try {
      const loggedIn = await authService.login(email, password);
      setUser(loggedIn);
      if (loggedIn.role === "rider") {
        const rProfile = await ridersService.getProfile(loggedIn.uid);
        setRiderProfile(rProfile);
      } else {
        setRiderProfile(null);
      }
      toast.success(`Welcome back, ${loggedIn.fullName}!`);
      return loggedIn;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setRiderProfile(null);
      MockStore.setCurrentUser(null);
      toast.info("You have been signed out.");
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (data: any): Promise<AppUser> => {
    setLoading(true);
    try {
      const newUser = await authService.registerCustomer(data);
      setUser(newUser);
      setRiderProfile(null);
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
      setUser(demoUser);
      if (targetRole === "rider") {
        const r = await ridersService.getProfile(demoUser.uid);
        setRiderProfile(r);
      } else {
        setRiderProfile(null);
      }
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
