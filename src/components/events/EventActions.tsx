"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./EventActions.module.css";

const TRACK_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/event-track";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

type MetricKind = "view" | "share" | "map_click";
type Source = "noxa" | "instagram" | "google" | "facebook" | "tiktok" | "direct" | "other";

type Props = {
  eventId: string;
  eventTitle: string;
  eventUrl: string;
  locationQuery: string;
  locale: "en" | "el";
};

function sourceFromPage(): Source {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const explicit = (params.get("utm_source") || params.get("src") || "").toLowerCase();
  if (explicit.includes("instagram")) return "instagram";
  if (explicit.includes("google")) return "google";
  if (explicit.includes("facebook") || explicit === "fb") return "facebook";
  if (explicit.includes("tiktok")) return "tiktok";
  if (explicit.includes("noxa")) return "noxa";

  if (!document.referrer) return "direct";
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host === window.location.hostname || host.endsWith("noxastreetapp.com")) return "noxa";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("google")) return "google";
    if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    return "other";
  } catch {
    return "other";
  }
}

async function track(eventId: string, kind: MetricKind, source: Source) {
  try {
    await fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, kind, source }),
      keepalive: true,
    });
  } catch {
    // Analytics must never block the event page.
  }
}

export function EventActions({ eventId, eventTitle, eventUrl, locationQuery, locale }: Props) {
  const [copied, setCopied] = useState(false);
  const source = useMemo(() => sourceFromPage(), []);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
  const text = locale === "el"
    ? { map: "Άνοιξε στον χάρτη", share: "Κοινοποίηση", copied: "Αντιγράφηκε" }
    : { map: "Open Map", share: "Share Event", copied: "Copied" };

  useEffect(() => {
    void track(eventId, "view", source);
  }, [eventId, source]);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: eventTitle, url: eventUrl });
      } else {
        await navigator.clipboard.writeText(eventUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
      void track(eventId, "share", source);
    } catch {
      // A cancelled native share is not counted.
    }
  }

  return (
    <div className={styles.actions}>
      <a
        className={styles.primary}
        href={mapHref}
        onClick={() => void track(eventId, "map_click", source)}
        rel="noreferrer"
        target="_blank"
      >
        {text.map} <span aria-hidden="true">↗</span>
      </a>
      <button className={styles.secondary} onClick={() => void share()} type="button">
        {copied ? text.copied : text.share} <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
