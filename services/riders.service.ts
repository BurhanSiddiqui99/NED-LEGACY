import {
  getRiderProfile,
  updateRiderLocation,
  updateRiderAvailability,
  subscribeToAllRiders,
  toggleRiderVerification,
  setRiderCity,
} from "@/lib/firebase/firestore";
import { Rider } from "@/types";

export const ridersService = {
  async getProfile(uid: string): Promise<Rider | null> {
    return getRiderProfile(uid);
  },

  async updateLocation(uid: string, latitude: number, longitude: number) {
    return updateRiderLocation(uid, latitude, longitude);
  },

  async updateAvailability(uid: string, isAvailable: boolean) {
    return updateRiderAvailability(uid, isAvailable);
  },

  subscribeRiders(callback: (riders: Rider[]) => void) {
    return subscribeToAllRiders(callback);
  },

  async toggleVerification(uid: string, currentStatus: boolean) {
    return toggleRiderVerification(uid, currentStatus);
  },

  async setCity(uid: string, warehouseId: string, city: string) {
    return setRiderCity(uid, warehouseId, city);
  },
};
