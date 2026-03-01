import { Router, Request, Response } from "express";
import { adminAuth, writeAudit, AdminRequest } from "../middleware/adminAuth";
import { createClient } from "../lib/supabase";

export const adminRouter = Router();

// Apply admin auth to all routes in this router
adminRouter.use(adminAuth);

// ─── Helper to get client IP ──────────────────────────────────────────────────
function getIp(req: Request) {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/stats — dashboard KPIs
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/stats", async (_req: Request, res: Response) => {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: completedProjects },
    { count: processingProjects },
    { count: failedProjects },
    { data: recentProjects },
    { data: planBreakdown },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("projects")
      .select("id, name, status, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("plan"),
  ]);

  // Plan breakdown tally
  const plans: Record<string, number> = {};
  (planBreakdown || []).forEach((p: { plan: string }) => {
    plans[p.plan] = (plans[p.plan] || 0) + 1;
  });

  return res.json({
    users: totalUsers ?? 0,
    projects: {
      total: totalProjects ?? 0,
      completed: completedProjects ?? 0,
      processing: processingProjects ?? 0,
      failed: failedProjects ?? 0,
    },
    plans,
    recentProjects: recentProjects ?? [],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/users — list all users (paginated + searchable)
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/users", async (req: Request, res: Response) => {
  const supabase = createClient();
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const search = (req.query.search as string) || "";
  const plan = (req.query.plan as string) || "";
  const from = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select(
      "id, email, full_name, plan, credits_remaining, credits_used, is_admin, created_at, stripe_customer_id",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (plan) {
    query = query.eq("plan", plan);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ users: data, total: count, page, limit });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/users/:id — single user with their projects
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/users/:id", async (req: Request, res: Response) => {
  const supabase = createClient();
  const userId = req.params.id;

  const [{ data: profile }, { data: projects }, { data: transactions }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("projects")
        .select("id, name, status, style, created_at, staged_image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("credit_transactions")
        .select("id, amount, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!profile) return res.status(404).json({ error: "User not found" });

  return res.json({
    profile,
    projects: projects ?? [],
    transactions: transactions ?? [],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /admin/users/:id — permanently delete user from auth + profile
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.delete("/users/:id", async (req: Request, res: Response) => {
  const admin = (req as AdminRequest).adminUser;
  const supabase = createClient();
  const userId = req.params.id;

  // Fetch profile for audit snapshot before deletion
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return res.status(404).json({ error: "User not found" });

  // Delete from Supabase Auth — this invalidates all sessions/tokens immediately
  // and cascades to the profiles row (via on delete cascade in migrations)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  await writeAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "delete_user",
    targetType: "user",
    targetId: userId,
    beforeData: profile,
    afterData: null,
    ip: getIp(req),
  });

  return res.json({ success: true, deletedUserId: userId });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/users/:id — update user plan, credits, admin flag, deactivate
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.patch("/users/:id", async (req: Request, res: Response) => {
  const admin = (req as AdminRequest).adminUser;
  const supabase = createClient();
  const userId = req.params.id;

  const allowed = ["plan", "credits_remaining", "is_admin", "full_name"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Snapshot before
  const { data: before } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: after, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "update_user",
    targetType: "user",
    targetId: userId,
    beforeData: before,
    afterData: after,
    ip: getIp(req),
  });

  return res.json({ user: after });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/users/:id/credits — add/subtract credits manually
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.post("/users/:id/credits", async (req: Request, res: Response) => {
  const admin = (req as AdminRequest).adminUser;
  const supabase = createClient();
  const userId = req.params.id;
  const { amount, description } = req.body as {
    amount: number;
    description: string;
  };

  if (typeof amount !== "number" || !description) {
    return res.status(400).json({ error: "amount and description required" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (!profile) return res.status(404).json({ error: "User not found" });

  const newCredits = profile.credits_remaining + amount;

  await Promise.all([
    supabase
      .from("profiles")
      .update({ credits_remaining: newCredits })
      .eq("id", userId),
    supabase.from("credit_transactions").insert({
      user_id: userId,
      amount,
      description: `[Admin] ${description}`,
    }),
  ]);

  await writeAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "adjust_credits",
    targetType: "user",
    targetId: userId,
    beforeData: { credits_remaining: profile.credits_remaining },
    afterData: { credits_remaining: newCredits, adjustment: amount },
    ip: getIp(req),
  });

  return res.json({ credits_remaining: newCredits });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/projects — all projects with filters
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/projects", async (req: Request, res: Response) => {
  const supabase = createClient();
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const status = (req.query.status as string) || "";
  const search = (req.query.search as string) || "";
  const userId = (req.query.user_id as string) || "";
  const from = (page - 1) * limit;

  let query = supabase
    .from("projects")
    .select(
      `id, name, status, style, created_at, updated_at, original_image_url, staged_image_url, error_message,
      profiles!user_id(id, email, full_name)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ projects: data, total: count, page, limit });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/projects/:id — project detail with notes
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/projects/:id", async (req: Request, res: Response) => {
  const supabase = createClient();
  const projectId = req.params.id;

  const [{ data: project }, { data: notes }] = await Promise.all([
    supabase
      .from("projects")
      .select(`*, profiles!user_id(id, email, full_name, plan)`)
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_notes")
      .select("id, content, author_email, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  if (!project) return res.status(404).json({ error: "Project not found" });

  return res.json({ project, notes: notes ?? [] });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/projects/:id/status — update project status
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.patch(
  "/projects/:id/status",
  async (req: Request, res: Response) => {
    const admin = (req as AdminRequest).adminUser;
    const supabase = createClient();
    const projectId = req.params.id;
    const { status } = req.body as { status: string };

    const validStatuses = ["pending", "processing", "completed", "failed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const { data: before } = await supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single();

    const { data: project, error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await writeAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "update_project_status",
      targetType: "project",
      targetId: projectId,
      beforeData: before,
      afterData: { status },
      ip: getIp(req),
    });

    return res.json({ project });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/projects/:id/notes — add internal note
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.post("/projects/:id/notes", async (req: Request, res: Response) => {
  const admin = (req as AdminRequest).adminUser;
  const supabase = createClient();
  const projectId = req.params.id;
  const { content } = req.body as { content: string };

  if (!content?.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  const { data: note, error } = await supabase
    .from("project_notes")
    .insert({
      project_id: projectId,
      author_id: admin.id === "system" ? null : admin.id,
      author_email: admin.email,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "add_project_note",
    targetType: "project",
    targetId: projectId,
    afterData: { content: content.trim() },
    ip: getIp(req),
  });

  return res.status(201).json({ note });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/audit — audit log with filters
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.get("/audit", async (req: Request, res: Response) => {
  const supabase = createClient();
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const actor = (req.query.actor as string) || "";
  const action = (req.query.action as string) || "";
  const from = (page - 1) * limit;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (actor) query = query.ilike("actor_email", `%${actor}%`);
  if (action) query = query.eq("action", action);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ logs: data, total: count, page, limit });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /admin/projects/:id — hard delete (dangerous, admin only)
// ─────────────────────────────────────────────────────────────────────────────
adminRouter.delete("/projects/:id", async (req: Request, res: Response) => {
  const admin = (req as AdminRequest).adminUser;
  const supabase = createClient();
  const projectId = req.params.id;

  const { data: before } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) return res.status(500).json({ error: error.message });

  await writeAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "delete_project",
    targetType: "project",
    targetId: projectId,
    beforeData: before,
    ip: getIp(req),
  });

  return res.json({ success: true });
});
