import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { canSend, checkOtp, clearSend, issueOtp, registerAttempt } from "@/lib/server/otp";
import { isMailConfigured, sendResetCodeEmail } from "@/lib/server/mailer";

export const runtime = "nodejs";

/** Firebase Admin lets the server set a new password once the emailed code is verified. */
function adminAuth() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!clientEmail || !privateKey || !projectId) return null;
  const app = getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getAuth(app);
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * { action: "send", email }                          -> emails a 6-digit code, returns a token
 * { action: "reset", email, code, token, password }  -> checks the code and sets the new password
 * The code is only ever emailed; it is never returned to the browser.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");

  const auth = adminAuth();
  if (!auth || !isMailConfigured()) {
    console.error("Password reset needs SMTP_* and FIREBASE_ADMIN_* environment variables.");
    return fail("Password reset isn't set up on this server yet.", 503);
  }

  if (body.action === "send") {
    const key = `reset:${email}`;
    if (!canSend(key, 60_000)) return fail("Please wait a minute before requesting another code.", 429);
    const user = await auth.getUserByEmail(email).catch(() => null);
    if (!user) {
      clearSend(key);
      return fail("No account found with this email.", 404);
    }

    const { code, token } = issueOtp(email, "password_reset", "user");
    try {
      await sendResetCodeEmail(email, code);
    } catch (err) {
      console.error("Reset email failed:", err);
      clearSend(key);
      return fail("Could not send the email. Please try again.", 502);
    }
    return NextResponse.json({ token });
  }

  if (body.action === "reset") {
    const { code, token, password } = body;
    if (typeof code !== "string" || typeof token !== "string") return fail("Enter the code from the email.");
    if (typeof password !== "string" || password.length < 6) return fail("Password must be at least 6 characters.");
    if (!registerAttempt(token)) return fail("Too many attempts. Request a new code.", 429);

    const check = checkOtp(email, "password_reset", "user", code.trim(), token);
    if (!check.ok) return fail(check.reason);

    try {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password });
      await auth.revokeRefreshTokens(user.uid);
    } catch (err) {
      console.error("Password update failed:", err);
      return fail("Could not update the password. Please try again.", 500);
    }
    return NextResponse.json({ ok: true });
  }

  return fail("Unknown action.");
}
