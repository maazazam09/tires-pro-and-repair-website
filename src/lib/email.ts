import type { FormSubmissionRecord } from "@/lib/submissions-store";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function row(label: string, value: string) {
  if (!value) return "";

  return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-weight:700;color:#1A1A1A;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;color:#1A1A1A;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export async function sendAdminSubmissionEmail(submission: FormSubmissionRecord) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM ?? "Tire Pro and Repair <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.warn("Skipping admin email: RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL is not configured.");
    return false;
  }

  const replyTo = submission.email || undefined;
  const subject = `${submission.type === "quote" ? "New booking request" : "New contact form"} from ${submission.name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
        <div style="background:#1A1A1A;color:#F9F9F9;padding:18px 20px;">
          <h1 style="margin:0;font-size:22px;">${escapeHtml(subject)}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${row("Name", submission.name)}
          ${row("Phone", submission.phone)}
          ${row("Email", submission.email)}
          ${row("Service", submission.service)}
          ${row("Preferred date", submission.preferredDate)}
          ${row("Preferred time", submission.preferredTime)}
          ${row("Submitted", submission.createdAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))}
        </table>
        <div style="padding:18px 20px;">
          <h2 style="font-size:16px;color:#1A1A1A;margin:0 0 8px;">Message</h2>
          <p style="white-space:pre-wrap;color:#1A1A1A;margin:0;">${escapeHtml(submission.message)}</p>
        </div>
        <div style="padding:14px 20px;background:#fff3f3;color:#1A1A1A;border-top:3px solid #E50914;">
          Reply to the customer to confirm whether this requested slot is available.
        </div>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(`Resend email failed: ${response.status} ${error}`);
  }

  return true;
}
