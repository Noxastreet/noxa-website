import { type NextRequest, NextResponse } from "next/server";

import {
  defaultLocale,
  isLocale,
  localeFromAcceptLanguage,
} from "@/i18n/site-copy";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const savedLocale = request.cookies.get("noxa-locale")?.value;
    const locale = isLocale(savedLocale)
      ? savedLocale
      : localeFromAcceptLanguage(request.headers.get("accept-language"));
    const destination = request.nextUrl.clone();

    destination.pathname = `/${locale || defaultLocale}`;
    return NextResponse.redirect(destination);
  }

  const routeLocale = pathname.split("/")[1];
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(
    "x-noxa-locale",
    isLocale(routeLocale) ? routeLocale : "en",
  );

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon.svg|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
