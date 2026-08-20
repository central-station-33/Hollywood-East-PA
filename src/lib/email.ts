import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Hollywood East PA <onboarding@resend.dev>";

// Notification emails are a nice-to-have layered on top of the in-app
// notifications table, which is always the source of truth. If RESEND_API_KEY
// isn't configured, log and no-op rather than failing the gig/dispatch flow
// that triggered the email.
async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not set — skipped email "${params.subject}" to ${params.to}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("Resend email failed:", error);
  }
}

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return base ? `${base}${path}` : path;
}

export async function sendGigInviteEmail(params: {
  to: string;
  paName: string;
  gigTitle: string;
  locationState: string;
  locationDetail: string | null;
  callTime: string;
}) {
  const when = new Date(params.callTime).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await sendEmail({
    to: params.to,
    subject: `New gig invite: ${params.gigTitle}`,
    html: `
      <p>Hi ${params.paName},</p>
      <p>You've been invited to a new gig that matches your state and role:</p>
      <p>
        <strong>${params.gigTitle}</strong><br/>
        ${params.locationState} · ${params.locationDetail ?? "Location TBD"}<br/>
        ${when}
      </p>
      <p>First to accept gets it — <a href="${appUrl("/pa/dashboard")}">open your dashboard</a> to respond.</p>
    `,
  });
}

export async function sendGigStatusEmail(params: {
  to: string;
  gigTitle: string;
  message: string;
}) {
  await sendEmail({
    to: params.to,
    subject: `Update on ${params.gigTitle}`,
    html: `
      <p>${params.message}</p>
      <p><a href="${appUrl("/pa/dashboard")}">View on your dashboard</a></p>
    `,
  });
}

export async function sendGigAcceptedEmail(params: {
  to: string;
  paName: string;
  gigTitle: string;
  filledCount: number;
  headcount: number;
}) {
  const status =
    params.filledCount >= params.headcount
      ? "Your gig is now fully staffed."
      : `${params.filledCount} of ${params.headcount} spots filled — still dispatching for the rest.`;

  await sendEmail({
    to: params.to,
    subject: `${params.paName} accepted: ${params.gigTitle}`,
    html: `
      <p><strong>${params.paName}</strong> accepted <strong>${params.gigTitle}</strong>.</p>
      <p>${status}</p>
      <p><a href="${appUrl("/producer/dashboard")}">View on your dashboard</a></p>
    `,
  });
}
