import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, pass through without auth checks
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If auth check fails, treat as unauthenticated
  }

  // If auth says the user exists, verify they still have a profile row.
  // This catches the case where an admin deleted the user from Supabase
  // but the JWT hasn't expired yet.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      // No profile = account deleted. Clear all Supabase auth cookies and
      // redirect to login so the client session is fully wiped.
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("reason", "account_deleted");
      const clearResponse = NextResponse.redirect(loginUrl);
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          clearResponse.cookies.delete(cookie.name);
        }
      });
      return clearResponse;
    }
  }

  // Redirect unauthenticated users away from protected routes
  const protectedRoutes = ["/dashboard"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes — unauthenticated users go to /admin/login
  // is_admin check happens in the (panel)/layout.tsx server component
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPage = request.nextUrl.pathname === "/admin/login";
  if (isAdminRoute && !isAdminLoginPage && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Redirect authenticated users away from public auth pages
  const authRoutes = ["/login", "/signup"];
  const isAuthPage = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
