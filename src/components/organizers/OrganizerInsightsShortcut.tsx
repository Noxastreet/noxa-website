"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SESSION_KEY = "noxa-organizer-session-v1";

export function OrganizerInsightsShortcut({ locale }: { locale: "en" | "el" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(Boolean(window.localStorage.getItem(SESSION_KEY)));
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <Link
      href={locale === "el" ? "/el/organizer/insights" : "/organizer/insights"}
      style={{
        position: "fixed",
        right: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: 45,
        display: "inline-flex",
        minHeight: 46,
        alignItems: "center",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 999,
        background: "rgba(12,12,14,.92)",
        padding: "0 16px",
        color: "white",
        fontSize: 12,
        fontWeight: 800,
        textDecoration: "none",
        boxShadow: "0 12px 40px rgba(0,0,0,.35)",
        backdropFilter: "blur(14px)",
      }}
    >
      {locale === "el" ? "Event Insights" : "Event Insights"} ↗
    </Link>
  );
}
