import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, imageUrl, style } = body;

  if (!projectId || !imageUrl || !style) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "API_URL is not configured on the server. Please set it in Vercel environment variables.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${apiUrl}/staging/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        imageUrl,
        style,
        userId: user.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Staging API returned an error" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Staging trigger error:", err);
    return NextResponse.json(
      {
        error:
          "Could not reach the staging API. Check that Render is running and API_URL is correct.",
      },
      { status: 502 },
    );
  }
}
