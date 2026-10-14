import { NextResponse } from "next/server";
import { canSend, issueOtp, maskEmail } from "@/lib/server/otp";
import { isMailConfigured, sendOtpEmail } from "@/lib/server/mailer";

export const runtime = "nodejs";

const CHECKPOINTS: Record<string, string> = {
  pickup: "Pickup verification",
  origin_warehouse: "Warehouse drop-off verification",
  warehouse_handover: "Warehouse handover verification",
  delivery: "Delivery verification",
};

/**
 * The code is emailed to the RIDER. The verifying party (customer or warehouse admin) asks the
 * rider for it and enters it in their own dashboard, which proves the rider is really there.
 */
const INSTRUCTIONS: Record<string, Record<string, string>> = {
  customer: {
    pickup: "Read this code to the customer when you collect the parcel. They will enter it in their LogiPulse app.",
    origin_warehouse: "Read this code to the customer once the parcel is handed in at the warehouse.",
    delivery: "Read this code to the customer when you hand over the parcel. They will enter it to confirm delivery.",
  },
  admin: {
    origin_warehouse: "Read this code to the warehouse admin when you hand in the parcel.",
    warehouse_handover: "Read this code to the warehouse admin when you collect the parcel for delivery.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, checkpoint, party, email } = body || {};
  if (typeof orderId !== "string" || !/^[A-Za-z0-9-]{3,40}$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }
  if (!CHECKPOINTS[checkpoint] || !INSTRUCTIONS[party]?.[checkpoint]) {
    return NextResponse.json({ error: "Invalid verification step." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Your account has no valid email address." }, { status: 400 });
  }

  if (!canSend(`${orderId}:${checkpoint}:${party}`)) {
    return NextResponse.json({ error: "A code was just sent. Please wait 30 seconds before resending." }, { status: 429 });
  }

  const { code, token, expiresAt } = issueOtp(orderId, checkpoint, party);
  const sentTo = maskEmail(email);

  if (!isMailConfigured()) {
    // Local demo without SMTP: hand the code back so the flow can still be tested.
    if (process.env.NODE_ENV === "production" && process.env.OTP_DEMO_MODE !== "true") {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }
    console.info(`[OTP demo] ${checkpoint}/${party} for #${orderId}: ${code}`);
    return NextResponse.json({ token, expiresAt, sentTo, demoCode: code });
  }

  try {
    await sendOtpEmail({
      to: email,
      code,
      orderId,
      checkpointLabel: `${CHECKPOINTS[checkpoint]} (for the ${party === "admin" ? "warehouse admin" : "customer"})`,
      instructions: INSTRUCTIONS[party][checkpoint],
    });
  } catch (err: any) {
    console.error("OTP email failed:", err);
    return NextResponse.json({ error: "Could not send the verification email. Try again." }, { status: 502 });
  }

  return NextResponse.json({ token, expiresAt, sentTo });
}
