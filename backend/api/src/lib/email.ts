import { Resend } from "resend";
import {
  welcomeTemplate,
  stagingCompletedTemplate,
  resetPasswordTemplate,
  adminNewProjectTemplate,
} from "../emails/templates";

// ─── Resend client (lazy-init so cold boots don't throw) ─────────────────────
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "SnapStage <noreply@snapstage.app>";
const BASE_URL = process.env.APP_BASE_URL || "https://snapstage.app";

// ─── Helper ──────────────────────────────────────────────────────────────────
async function send(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[Email] send error:", error);
      return { success: false, error };
    }
    console.log("[Email] sent:", opts.subject, "→", opts.to, "id:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] unexpected error:", err);
    return { success: false, error: err };
  }
}

// ─── Public email functions ───────────────────────────────────────────────────

/** Sent after successful signup */
export function sendWelcomeEmail(opts: { to: string; name: string }) {
  return send({
    to: opts.to,
    subject: "Welcome to SnapStage 🏠",
    html: welcomeTemplate({ name: opts.name, baseUrl: BASE_URL }),
    text: `Hi ${opts.name},\n\nWelcome to SnapStage! You have 3 free credits to get started.\n\nVisit your dashboard: ${BASE_URL}/dashboard\n\nTeam SnapStage`,
  });
}

/** Sent when AI staging completes successfully */
export function sendStagingCompletedEmail(opts: {
  to: string;
  name: string;
  projectId: string;
  projectName: string;
}) {
  return send({
    to: opts.to,
    subject: "Your staged room is ready! ✨",
    html: stagingCompletedTemplate({
      name: opts.name,
      projectName: opts.projectName,
      projectUrl: `${BASE_URL}/dashboard/projects/${opts.projectId}`,
    }),
    text: `Hi ${opts.name},\n\nYour project "${opts.projectName}" has been staged!\n\nView it here: ${BASE_URL}/dashboard/projects/${opts.projectId}\n\nTeam SnapStage`,
  });
}

/** Sent for password reset requests */
export function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  return send({
    to: opts.to,
    subject: "Reset your SnapStage password",
    html: resetPasswordTemplate({
      name: opts.name,
      resetUrl: opts.resetUrl,
    }),
    text: `Hi ${opts.name},\n\nReset your password: ${opts.resetUrl}\n\nThis link expires in 60 minutes. If you didn't request this, ignore this email.\n\nTeam SnapStage`,
  });
}

/** Notify admin when a new project is submitted */
export function sendAdminNewProjectEmail(opts: {
  userEmail: string;
  projectId: string;
  projectName: string;
  style: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || FROM;
  return send({
    to: adminEmail,
    subject: `[Admin] New project: "${opts.projectName}"`,
    html: adminNewProjectTemplate({
      userEmail: opts.userEmail,
      projectName: opts.projectName,
      projectId: opts.projectId,
      style: opts.style,
      adminUrl: `${BASE_URL}/admin/projects`,
    }),
    text: `New project submitted\n\nUser: ${opts.userEmail}\nProject: ${opts.projectName}\nStyle: ${opts.style}\nID: ${opts.projectId}\n\nAdmin panel: ${BASE_URL}/admin/projects`,
  });
}
