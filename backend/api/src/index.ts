import "dotenv/config";
import express from "express";
import cors from "cors";
import { stagingRouter } from "./routes/staging";
import { paymentsRouter } from "./routes/payments";
import { adminRouter } from "./routes/admin";
import { emailsRouter } from "./routes/emails";

const app = express();
const PORT = process.env.PORT || 4000;

// ─── CORS (allow multiple origins: Vercel preview + production) ──────────────
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.APP_BASE_URL || "http://localhost:3000",
  ].filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// Raw body for Stripe webhooks (must come before express.json)
app.use("/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));

// ─── Health Check ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────
app.use("/staging", stagingRouter);
app.use("/payments", paymentsRouter);
app.use("/admin", adminRouter);
app.use("/emails", emailsRouter);

// ─── Error Handler ───────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Error]", err.message);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 SnapStage API running on http://localhost:${PORT}`);
});

export default app;
