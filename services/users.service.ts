import { getUserEmail, subscribeToAllUsers, toggleUserActive } from "@/lib/firebase/firestore";
import { AppUser } from "@/types";

export const usersService = {
  subscribeUsers(callback: (users: AppUser[]) => void) {
    return subscribeToAllUsers(callback);
  },

  async toggleActive(uid: string, currentStatus: boolean) {
    return toggleUserActive(uid, currentStatus);
  },

  async getEmail(uid: string) {
    return getUserEmail(uid);
  },
};
