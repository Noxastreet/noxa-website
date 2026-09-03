"use client";

import { useEffect, useState } from "react";

import styles from "./EventDetailPage.module.css";

const TRACK_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/event-track";

type Props = {
  eventId: string;
  eventTitle: string;
  mapQuery: string;
  locale: "en" | "el";
};

type MetricKind = "view" | "share" | "map_click";

function trafficSource() {
  if (typeof window === "undefined") return "direct";
  const query = new URLSearchParams(window.location.search);
  const tagged = (query.get("utm_source") ?? "").toLowerCase();
  if (tagged.includes("instagram")) return "instagram";
  if (tagged.includes("facebook") || tagged === "fb") return "facebook";
  if (tagged.includes("tiktok")) return "tiktok";
  if (tagged.includes("google")) return "google";
  if (tagged.includes("noxa")) return "noxa";

  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) return "noxa";
    const host = referrer.hostname.toLowerCase();
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("google")) return "google";
    return "other";
  } catch {
    return "other";
  }
}

function track(eventId: string, kind: MetricKind, source = "direct") {
  return fetch(TRACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, kind, source }),
    keepalive: true,
  }).catch(() => undefined);
}

export function EventActions({ eventId, eventTitle, mapQuery, locale }: Props) {
  const [shared, setShared] = useState(false);

  useEffect(() => {
    void track(eventId, "view", trafficSource());
  }, [eventId]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: eventTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
      void track(eventId, "share");
    } catch {
      // A dismissed native share sheet is not an error the user needs to see.
    }
  }

  function openMap() {
    void track(eventId, "map_click");
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.actions}>
      <button className={styles.primaryAction} onClick={openMap} type="button">
        {locale === "el" ? "Άνοιξε Χάρτη" : "Open Map"}
      </button>
      <button className={styles.secondaryAction} onClick={() => void share()} type="button">
        {shared ? (locale === "el" ? "Αντιγράφηκε" : "Copied") : (locale === "el" ? "Κοινοποίηση" : "Share")}
      </button>
    </div>
  );
}
