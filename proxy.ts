import { type NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/utils/auth-session";

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const hasSession =
    request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value === "1";

  if (nextUrl.pathname.startsWith("/editor") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname === "/change-password" && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/change-password");

    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/editor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/login", "/change-password"],
};

export default proxy;
