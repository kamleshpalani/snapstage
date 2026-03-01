import { Router, Request, Response } from "express";
import { createClient } from "../lib/supabase";
import { sendWelcomeEmail } from "../lib/email";

export const emailsRouter = Router();

/**
 * POST /emails/welcome
 * Sends the welcome email for a newly signed-up user.
 * Protected by user's JWT — sends email to the calling user only.
 * Called from the frontend auth callback shortly after signup.
 */
emailsRouter.post("/welcome", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  // Only send if the account is fresh (created in the last 5 minutes)
  const createdAt = new Date(profile.created_at).getTime();
  const ageMs = Date.now() - createdAt;
  if (ageMs > 5 * 60 * 1000) {
    return res.json({ skipped: true, reason: "Account is not new" });
  }

  const result = await sendWelcomeEmail({
    to: profile.email,
    name: profile.full_name || profile.email.split("@")[0],
  });

  return res.json(result);
});
