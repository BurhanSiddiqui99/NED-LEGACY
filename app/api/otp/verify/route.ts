import { NextResponse } from "next/server";
import { checkOtp, registerAttempt } from "@/lib/server/otp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, checkpoint, party, code, token } = body || {};
  if ([orderId, checkpoint, party, code, token].some((v) => typeof v !== "string")) {
    return NextResponse.json({ ok: false, error: "Missing fields." }, { status: 400 });
  }

  if (!registerAttempt(token)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Send a new code." }, { status: 429 });
  }

  const result = checkOtp(orderId, checkpoint, party, code.trim(), token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
