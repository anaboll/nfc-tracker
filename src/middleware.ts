export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/stats/:path*", "/api/tags/:path*", "/api/upload/:path*"],
};
