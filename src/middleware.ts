import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLI_USER_AGENTS = /curl|wget|wet|HTTPie|fetch\s+lib/i;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") ?? "";
  if (CLI_USER_AGENTS.test(ua)) {
    const target = new URL("/api/cli", request.url);
    target.search = request.nextUrl.search; // preserve ?w= / ?cols=
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}
