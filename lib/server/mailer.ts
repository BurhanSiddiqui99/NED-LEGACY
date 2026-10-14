import "server-only";
import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  orderId: string;
  checkpointLabel: string;
  instructions: string;
}): Promise<void> {
  const { to, code, orderId, checkpointLabel, instructions } = opts;
  const from = process.env.SMTP_FROM || `LogiPulse <${process.env.SMTP_USER}>`;

  await getTransporter().sendMail({
    from,
    to,
    subject: `LogiPulse ${checkpointLabel} code for order #${orderId}: ${code}`,
    text: `Your LogiPulse verification code for order #${orderId} (${checkpointLabel}) is ${code}.\n\n${instructions}\n\nThe code expires in 15 minutes. Only read it out in person, at the handover.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
        <h2 style="margin:0 0 4px;color:#142B49">LogiPulse</h2>
        <p style="margin:0 0 16px;color:#64748b;font-size:13px">${escape(checkpointLabel)} · Order #${escape(orderId)}</p>
        <p style="font-size:14px;color:#0f172a">Your verification code:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:800;color:#2563EB;margin:8px 0 16px">${code}</p>
        <p style="font-size:13px;color:#334155">${escape(instructions)}</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px">Expires in 15 minutes. Only read it out in person, at the handover.</p>
      </div>`,
  });
}

export async function sendResetCodeEmail(to: string, code: string): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `LogiPulse <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} is your LogiPulse password reset code`,
    text: `Your LogiPulse password reset code is ${code}. It expires in 15 minutes. If you didn't ask for this, ignore this email.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #dde5e0;border-radius:16px">
        <h2 style="margin:0 0 12px;color:#027A48">LogiPulse password reset</h2>
        <p style="font-size:14px;color:#141a16">Your reset code:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:800;color:#039855;margin:8px 0 16px">${code}</p>
        <p style="font-size:12px;color:#93a199">Expires in 15 minutes. Never share it. If you didn't ask for this, ignore this email.</p>
      </div>`,
  });
}
