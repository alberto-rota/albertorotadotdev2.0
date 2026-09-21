import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLI_USER_AGENTS = /curl|wget|wet|HTTPie|fetch\s+lib/i;
const PRODUCTION_HOST = /(^|\.)albertorota\.dev$/i;

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  const proto = request.headers.get("x-forwarded-proto");
  if (PRODUCTION_HOST.test(host) && proto === "http") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") ?? "";
  if (CLI_USER_AGENTS.test(ua)) {
    const target = new URL("/api/cli", request.url);
    target.search = request.nextUrl.search;
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
