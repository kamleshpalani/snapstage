/**
 * GET /api/staging/v2-health
 * Debug endpoint — visit in browser to confirm API_URL is set and backend is up.
 * Returns env var status + ping result from Render.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiUrl = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");

  if (!apiUrl) {
    return NextResponse.json({
      ok: false,
      problem: "API_URL and NEXT_PUBLIC_API_URL are both unset in Vercel env vars",
      fix: "Add API_URL = https://snapstage-api.onrender.com (or your Render URL) in Vercel → Settings → Environment Variables",
    }, { status: 500 });
  }

  // Ping the backend health endpoint
  try {
    const pingUrl = `${apiUrl}/health`;
    const res = await fetch(pingUrl, { cache: "no-store" });
    const body = await res.text().catch(() => "");
    return NextResponse.json({
      ok: res.ok,
      apiUrl: apiUrl.replace(/^(https?:\/\/[^/]{4}).*/, "$1***"),  // mask most of the domain
      status: res.status,
      backendResponse: body.slice(0, 200),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      apiUrl: apiUrl.replace(/^(https?:\/\/[^/]{4}).*/, "$1***"),
      problem: "Fetch to backend /health failed",
      detail,
      fix: "Check Render dashboard — service may be stopped, sleeping, or the URL is wrong",
    }, { status: 502 });
  }
}
