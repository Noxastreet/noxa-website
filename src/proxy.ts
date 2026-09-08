import { NextResponse, type NextRequest } from "next/server";

function isPublicOrganizerPath(pathname: string) {
  return pathname === "/organizer"
    || pathname.startsWith("/organizer/")
    || pathname === "/organizers"
    || pathname.startsWith("/organizers/")
    || pathname === "/el/organizer"
    || pathname.startsWith("/el/organizer/")
    || pathname === "/el/organizers"
    || pathname.startsWith("/el/organizers/");
}

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const locale = pathname === "/el" || pathname.startsWith("/el/") ? "el" : "en";

  if (isPublicOrganizerPath(pathname)) {
    return NextResponse.redirect(new URL(locale === "el" ? "/el/meets" : "/meets", request.url));
  }

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
