import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const locale = pathname === "/el" || pathname.startsWith("/el/") ? "el" : "en";

  requestHeaders.set("x-noxa-locale", locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm)$).*)"],
};
