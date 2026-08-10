"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { siteLocales, type Locale } from "@/i18n/site-copy";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
};

export function LocaleSwitcher({ locale, label }: LocaleSwitcherProps) {
  const router = useRouter();
  const [requestedLocale, setRequestedLocale] = useState<Locale | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!requestedLocale) return;

    document.cookie = `noxa-locale=${requestedLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.localStorage.setItem("noxa-locale", requestedLocale);
    router.push(`/${requestedLocale}`);
  }, [requestedLocale, router]);

  return (
    <div className="localeSwitch" role="group" aria-label={label}>
      {siteLocales.map((code) => (
        <Link
          key={code}
          href={`/${code}`}
          hrefLang={code}
          className={locale === code ? "active" : undefined}
          aria-current={locale === code ? "page" : undefined}
          onClick={(event) => {
            if (code === locale) return;

            event.preventDefault();
            setRequestedLocale(code);
          }}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
