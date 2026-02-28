import { Request, Response, NextFunction } from "express";
import { createClient } from "../lib/supabase";

// Extend Express request type to carry admin user info
export interface AdminRequest extends Request {
  adminUser: {
    id: string;
    email: string;
    is_admin: boolean;
  };
}

/**
 * adminAuth — verifies the caller is:
 *   1. Authenticated (valid Supabase JWT in Authorization header)
 *   2. An admin (is_admin = true in profiles table)
 *
 * Also accepts a static ADMIN_SECRET via X-Admin-Secret header for
 * server-to-server calls (e.g. cron jobs, internal scripts).
 */
export async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // ── Static secret fallback (server-to-server) ────────────────────────────
  const staticSecret = req.headers["x-admin-secret"];
  if (staticSecret && staticSecret === process.env.ADMIN_SECRET) {
    (req as AdminRequest).adminUser = {
      id: "system",
      email: "system",
      is_admin: true,
    };
    return next();
  }

  // ── JWT-based auth ────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const supabase = createClient();

  // Verify JWT against Supabase
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Check is_admin in profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: "Profile not found" });
  }

  if (!profile.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  (req as AdminRequest).adminUser = {
    id: profile.id,
    email: profile.email,
    is_admin: profile.is_admin,
  };

  next();
}

/** Write an audit log entry (fire-and-forget, never throws) */
export async function writeAudit(opts: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ip?: string;
}) {
  try {
    const supabase = createClient();
    await supabase.from("audit_logs").insert({
      actor_id: opts.actorId === "system" ? null : opts.actorId,
      actor_email: opts.actorEmail,
      action: opts.action,
      target_type: opts.targetType,
      target_id: opts.targetId,
      before_data: opts.beforeData ?? null,
      after_data: opts.afterData ?? null,
      ip: opts.ip,
    });
  } catch (err) {
    console.error("[Audit] write failed:", err);
  }
}
