import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Public POST endpoints (tracking from public pages)
  const publicPostPaths = ["/api/link-click", "/api/video-event"];
  if (method === "POST" && publicPostPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected routes - check auth
  const protectedPaths = ["/dashboard", "/api/stats", "/api/tags", "/api/upload", "/api/clients", "/api/link-click", "/api/video-event"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Use real host to avoid Docker 0.0.0.0 leak
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "twojenfc.pl";
    const loginUrl = new URL("/login", `${proto}://${host}`);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/stats/:path*",
    "/api/tags/:path*",
    "/api/upload/:path*",
    "/api/clients/:path*",
    "/api/link-click/:path*",
    "/api/video-event/:path*",
  ],
};
