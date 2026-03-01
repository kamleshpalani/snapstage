import { Request, Response, NextFunction } from "express";
import { createClient } from "../lib/supabase";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Guard: check the user still has a profile row (catches deleted accounts
  // whose JWT has not yet expired).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return res.status(401).json({ error: "Account no longer exists" });
  }

  // Attach user to request
  (req as Request & { user: typeof user }).user = user;
  next();
}
