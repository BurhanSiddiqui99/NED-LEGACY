import {
  registerCustomer,
  registerRider,
  loginUser,
  logoutUser,
  resetPassword,
  getUserRole,
  RegisterCustomerData,
  RegisterRiderData,
} from "@/lib/firebase/auth";
import { MockStore } from "@/lib/firebase/mock-store";
import { AppUser, UserRole } from "@/types";

export const authService = {
  async registerCustomer(data: RegisterCustomerData) {
    return registerCustomer(data);
  },

  async registerRider(data: RegisterRiderData) {
    return registerRider(data);
  },

  async login(email: string, password?: string) {
    return loginUser(email, password);
  },

  async logout() {
    return logoutUser();
  },

  async resetPassword(email: string) {
    return resetPassword(email);
  },

  async getUserRole(uid: string): Promise<UserRole | null> {
    return getUserRole(uid);
  },

  getCurrentUser(): AppUser | null {
    return MockStore.getCurrentUser();
  },
};
