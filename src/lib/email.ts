import type { FormSubmissionRecord } from "@/lib/submissions-store";
import { getRuntimeEnv } from "@/lib/runtime-env";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function phoneLink(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function mailtoSubject(value: string) {
  return encodeURIComponent(value);
}

function formatSubmittedDate(value: Date) {
  return value.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function emailAddressCell(email: string) {
  if (!email) return "Not provided";

  return `
    <a
      href="mailto:${escapeHtml(email)}"
      style="
        color: #b91c1c;
        text-decoration: none;
        font-weight: 700;
      "
    >
      ${escapeHtml(email)}
    </a>
  `;
}

function buildAdminEmailHtml(submission: FormSubmissionRecord) {
  const typeLabel = submission.type === "quote" ? "Booking Request" : "Contact Message";
  const submittedAt = formatSubmittedDate(submission.createdAt);
  const callHref = phoneLink(submission.phone);
  const serviceDisplay = submission.service || "Not provided";
  const preferredDateDisplay = submission.preferredDate || "Not provided";
  const preferredTimeDisplay = submission.preferredTime || "Not provided";
  const emailHref = submission.email
    ? `mailto:${escapeHtml(submission.email)}?subject=${mailtoSubject("Regarding Your Tire Pro & Repair Request")}`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>New ${escapeHtml(typeLabel)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: Arial, Helvetica, sans-serif; color: #1f2937; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; line-height: 1px; font-size: 1px;">
    A new ${escapeHtml(typeLabel)} has been submitted by ${escapeHtml(submission.name)}.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f4f5f7; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 640px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; border-collapse: separate; overflow: hidden;">
          <tr>
            <td style="padding: 24px 28px; background-color: #111827; border-bottom: 4px solid #dc2626;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td valign="middle">
                    <p style="margin: 0 0 5px; color: #ffffff; font-size: 20px; line-height: 28px; font-weight: 700;">Tire Pro &amp; Repair</p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 20px;">Website Form Notification</p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 7px 12px; background-color: #ffffff; color: #111827; border-radius: 20px; font-size: 12px; line-height: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      New ${escapeHtml(typeLabel)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 28px 20px;">
              <h1 style="margin: 0 0 10px; color: #111827; font-size: 24px; line-height: 32px; font-weight: 700;">New ${escapeHtml(typeLabel)} Received</h1>
              <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 24px;">A customer has submitted a new request through the Tire Pro &amp; Repair website. The complete submission details are provided below.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; line-height: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Submission Reference</p>
                    <p style="margin: 0; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600; word-break: break-all;">${escapeHtml(submission.id)}</p>
                  </td>
                  <td align="right" style="padding: 16px 18px; border-left: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; line-height: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Submitted</p>
                    <p style="margin: 0; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(submittedAt)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 0 28px 12px;"><h2 style="margin: 0; color: #111827; font-size: 17px; line-height: 24px; font-weight: 700;">Customer Details</h2></td></tr>
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; overflow: hidden;">
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Full Name</td>
                  <td style="padding: 13px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(submission.name)}</td>
                </tr>
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Phone Number</td>
                  <td style="padding: 13px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">
                    <a href="tel:${escapeHtml(callHref)}" style="color: #b91c1c; text-decoration: none; font-weight: 700;">${escapeHtml(submission.phone)}</a>
                  </td>
                </tr>
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Email Address</td>
                  <td style="padding: 13px 16px; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600; word-break: break-word;">${emailAddressCell(submission.email)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 0 28px 12px;"><h2 style="margin: 0; color: #111827; font-size: 17px; line-height: 24px; font-weight: 700;">Request Details</h2></td></tr>
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; overflow: hidden;">
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Request Type</td>
                  <td style="padding: 13px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(typeLabel)}</td>
                </tr>
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Service</td>
                  <td style="padding: 13px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(serviceDisplay)}</td>
                </tr>
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Preferred Date</td>
                  <td style="padding: 13px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(preferredDateDisplay)}</td>
                </tr>
                <tr>
                  <td width="34%" style="padding: 13px 16px; background-color: #f9fafb; color: #6b7280; font-size: 13px; line-height: 20px; font-weight: 600;">Preferred Time</td>
                  <td style="padding: 13px 16px; color: #111827; font-size: 14px; line-height: 21px; font-weight: 600;">${escapeHtml(preferredTimeDisplay)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 0 28px 12px;"><h2 style="margin: 0; color: #111827; font-size: 17px; line-height: 24px; font-weight: 700;">Customer Message</h2></td></tr>
          <tr>
            <td style="padding: 0 28px 28px;">
              <div style="padding: 17px 18px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-left: 4px solid #dc2626; border-radius: 8px;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 23px; white-space: pre-line; word-break: break-word;">${escapeHtml(submission.message)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="background-color: #dc2626; border-radius: 6px;">
                    <a href="tel:${escapeHtml(callHref)}" style="display: inline-block; padding: 12px 20px; color: #ffffff; font-size: 14px; line-height: 20px; font-weight: 700; text-decoration: none; border-radius: 6px;">Call Customer</a>
                  </td>
                  ${submission.email ? `
                  <td style="width: 10px;"></td>
                  <td style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px;">
                    <a href="${emailHref}" style="display: inline-block; padding: 11px 20px; color: #111827; font-size: 14px; line-height: 20px; font-weight: 700; text-decoration: none; border-radius: 6px;">Email Customer</a>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; border-collapse: separate;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 20px;"><strong>Admin reminder:</strong> Please contact the customer to confirm availability, pricing and appointment details before finalizing the booking.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 22px 28px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 6px; color: #4b5563; font-size: 13px; line-height: 20px; font-weight: 600;">Tire Pro &amp; Repair</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px;">This is an automated admin notification generated from your website.</p>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0 0; color: #9ca3af; font-size: 11px; line-height: 17px; text-align: center;">Submission ID: ${escapeHtml(submission.id)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
export async function sendAdminSubmissionEmail(submission: FormSubmissionRecord) {
  const apiKey = getRuntimeEnv("RESEND_API_KEY");
  const to = getRuntimeEnv("ADMIN_NOTIFICATION_EMAIL") || getRuntimeEnv("ADMIN_EMAIL");
  const from = getRuntimeEnv("EMAIL_FROM") || "Tire Pro and Repair <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.warn("Skipping admin email: RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL is not configured.");
    return false;
  }

  const replyTo = submission.email || undefined;
  const subject = `${submission.type === "quote" ? "New booking request" : "New contact form"} from ${submission.name}`;
  const html = buildAdminEmailHtml(submission);

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
