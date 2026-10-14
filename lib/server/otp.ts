import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

const OTP_TTL_MS = 15 * 60 * 1000;

function secret(): string {
  const s = process.env.OTP_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET (16+ chars) must be set in production.");
  }
  return "logipulse-dev-otp-secret-change-me";
}

function sign(orderId: string, checkpoint: string, party: string, code: string, expiresAt: number): string {
  return createHmac("sha256", secret()).update(`${orderId}|${checkpoint}|${party}|${code}|${expiresAt}`).digest("hex");
}

/**
 * Creates a 6-digit code and a token that proves it, without storing the code anywhere.
 * The token is saved on the order; only someone who knows the code can make it verify.
 */
export function issueOtp(orderId: string, checkpoint: string, party: string): { code: string; token: string; expiresAt: number } {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = Date.now() + OTP_TTL_MS;
  return { code, expiresAt, token: `${expiresAt}.${sign(orderId, checkpoint, party, code, expiresAt)}` };
}

export function checkOtp(
  orderId: string,
  checkpoint: string,
  party: string,
  code: string,
  token: string
): { ok: true } | { ok: false; reason: string } {
  const [expStr, mac] = token.split(".");
  const expiresAt = Number(expStr);
  if (!expiresAt || !mac) return { ok: false, reason: "Invalid verification token." };
  if (Date.now() > expiresAt) return { ok: false, reason: "This code has expired. Send a new one." };
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "Enter the 6-digit code." };

  const expected = Buffer.from(sign(orderId, checkpoint, party, code, expiresAt), "hex");
  const given = Buffer.from(mac, "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "Incorrect code." };
  }
  return { ok: true };
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

/* Simple in-memory throttling (per server instance) */
const lastSend = new Map<string, number>();
const attempts = new Map<string, number>();

export function canSend(key: string, cooldownMs = 30_000): boolean {
  const last = lastSend.get(key) || 0;
  if (Date.now() - last < cooldownMs) return false;
  lastSend.set(key, Date.now());
  return true;
}

export function registerAttempt(token: string, max = 5): boolean {
  const n = (attempts.get(token) || 0) + 1;
  attempts.set(token, n);
  return n <= max;
}
