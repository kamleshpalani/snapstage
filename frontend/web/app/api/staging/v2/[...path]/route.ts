/**
 * Catch-all proxy for staging/v2 backend endpoints.
 * Forwards requests to the Render API server with the user's Authorization header.
 * All methods supported: GET, POST.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxyRequest(req, params.path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxyRequest(req, params.path, "POST");
}

async function proxyRequest(
  req: NextRequest,
  pathSegments: string[],
  method: "GET" | "POST",
): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL not configured — set API_URL or NEXT_PUBLIC_API_URL in Vercel env vars" },
      { status: 500 },
    );
  }

  const path = pathSegments.join("/");
  const searchParams = req.nextUrl.searchParams.toString();

  // Inject userId into GET query params or POST body
  let targetUrl = `${apiUrl}/staging/v2/${path}`;
  if (searchParams) targetUrl += `?${searchParams}`;

  let body: string | undefined;
  let bodyWithUserId: string | undefined;

  if (method === "POST") {
    try {
      const json = await req.json();
      bodyWithUserId = JSON.stringify({ ...json, userId });
    } catch {
      bodyWithUserId = JSON.stringify({ userId });
    }
  } else {
    // Append userId as query param for GET requests
    const sep = targetUrl.includes("?") ? "&" : "?";
    targetUrl += `${sep}userId=${userId}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? (bodyWithUserId ?? body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[staging/v2 proxy] error:", err);
    return NextResponse.json(
      { error: "Failed to reach staging service" },
      { status: 502 },
    );
  }
}
