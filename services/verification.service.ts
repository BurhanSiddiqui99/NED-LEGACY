import { Order, VerificationCheckpoint, VerificationParty } from "@/types";
import { ordersService } from "./orders.service";

/**
 * Email OTP verification.
 * 1. sendCode (rider): the server generates a code, emails it to the RIDER, and returns a signed
 *    token. Only the token is saved on the order; the code itself is never stored in the database.
 * 2. confirmCode (customer / admin): the verifying party asks the rider for the code and enters it
 *    in their own dashboard; the server checks it against the token.
 */
export const verificationService = {
  async sendCode(
    order: Order,
    checkpoint: VerificationCheckpoint,
    party: VerificationParty,
    riderEmail: string
  ): Promise<{ sentTo: string; demoCode?: string }> {
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, checkpoint, party, email: riderEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not send the verification code.");

    await ordersService.recordOtpChallenge(order.id, checkpoint, party, {
      token: data.token,
      sentTo: data.sentTo,
      sentAt: new Date().toISOString(),
      expiresAt: data.expiresAt,
    });
    return { sentTo: data.sentTo, demoCode: data.demoCode };
  },

  /** Returns the step that completed because of this code (e.g. "picked_up"), or null if more codes are needed. */
  async confirmCode(
    order: Order,
    checkpoint: VerificationCheckpoint,
    party: VerificationParty,
    code: string,
    actorUid: string
  ) {
    const token = order.verifications?.[checkpoint]?.challenges?.[party]?.token;
    if (!token) throw new Error("The rider has not requested a code yet.");

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, checkpoint, party, code, token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Verification failed.");

    return ordersService.recordVerification(order.id, checkpoint, party, actorUid);
  },
};
