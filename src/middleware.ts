import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Force HTTPS redirect when behind Cloudflare
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  if (proto === "http" && !host.includes("localhost") && !host.match(/^\d+\.\d+\.\d+\.\d+/)) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Protected routes - check auth
  const protectedPaths = ["/dashboard", "/api/stats", "/api/tags", "/api/upload"];
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
    const loginUrl = new URL("/login", request.url);
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
  ],
};
