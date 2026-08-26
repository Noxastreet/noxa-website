"use client";

import { useLayoutEffect } from "react";

import type { Locale } from "@/i18n/landing-copy";

export function DocumentLanguage({ locale }: { locale: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = "en";
    };
  }, [locale]);

  return null;
}
