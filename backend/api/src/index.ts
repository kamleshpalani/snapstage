import "dotenv/config";
import express from "express";
import cors from "cors";
import { stagingRouter } from "./routes/staging";
import { paymentsRouter } from "./routes/payments";

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ──────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
