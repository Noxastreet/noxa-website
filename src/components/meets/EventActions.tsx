"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { buildGoogleCalendarUrl, buildIcsCalendar } from "@/lib/meets/calendar";
import { readSavedEvents, toggleSavedEvent } from "@/lib/meets/savedEvents";

import styles from "./EventDetailPage.module.css";

const TRACK_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/event-track";
type MetricKind = "view" | "share" | "map_click";
type Props = {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  mapQuery: string;
  locale: "en" | "el";
};

function hostnameMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

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
    if (hostnameMatches(host, "instagram.com")) return "instagram";
    if (hostnameMatches(host, "facebook.com") || hostnameMatches(host, "fb.com")) return "facebook";
    if (hostnameMatches(host, "tiktok.com")) return "tiktok";
    if (hostnameMatches(host, "google.com")) return "google";
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

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export function EventActions({ eventId, eventTitle, startsAt, endsAt, location, mapQuery, locale }: Props) {
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reportMessage, setReportMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSaved(readSavedEvents(window.localStorage).includes(eventId));
    });
    void track(eventId, "view", trafficSource());
    return () => window.cancelAnimationFrame(frame);
  }, [eventId]);

  const t = locale === "el" ? {
    map: "Άνοιξε Χάρτη", share: "Κοινοποίηση", copied: "Αντιγράφηκε", save: "Αποθήκευση", saved: "Αποθηκεύτηκε",
    calendar: "Apple / .ics", google: "Google Calendar", story: "Story Card", report: "Διόρθωση Event",
    reportTitle: "Αναφορά / διόρθωση", reason: "Λόγος", details: "Λεπτομέρειες (προαιρετικό)", email: "Email (προαιρετικό)",
    send: "Αποστολή", sending: "Αποστολή…", sent: "Η αναφορά αποθηκεύτηκε για έλεγχο.", close: "Κλείσιμο",
    reasons: { time: "Λάθος ημερομηνία/ώρα", location: "Λάθος τοποθεσία", cancelled: "Ακυρώθηκε", duplicate: "Διπλό event", other: "Άλλο" },
  } : {
    map: "Open Map", share: "Share", copied: "Copied", save: "Save", saved: "Saved",
    calendar: "Apple / .ics", google: "Google Calendar", story: "Story Card", report: "Correct Event",
    reportTitle: "Report / correct event", reason: "Reason", details: "Details (optional)", email: "Email (optional)",
    send: "Submit", sending: "Sending…", sent: "Report saved for review.", close: "Close",
    reasons: { time: "Wrong date/time", location: "Wrong location", cancelled: "Cancelled", duplicate: "Duplicate", other: "Other" },
  };

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: eventTitle, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
      void track(eventId, "share");
    } catch {
      // Dismissing the native share sheet is not an error the user needs to see.
    }
  }

  function openMap() {
    void track(eventId, "map_click");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`, "_blank", "noopener,noreferrer");
  }

  function toggleSave() {
    setSaved(toggleSavedEvent(window.localStorage, eventId));
  }

  function downloadIcs() {
    const url = window.location.href;
    const ics = buildIcsCalendar({ id: eventId, title: eventTitle, startsAt, endsAt, location }, url);
    const filename = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "noxa-event";
    download(`${filename}.ics`, new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  }

  function googleCalendar() {
    window.open(
      buildGoogleCalendarUrl({ id: eventId, title: eventTitle, startsAt, endsAt, location }, window.location.href),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function storyCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, "#050505");
    gradient.addColorStop(0.62, "#0b0b0d");
    gradient.addColorStop(1, "#17050a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#c8102e";
    ctx.fillRect(72, 180, 72, 8);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 54px system-ui,sans-serif";
    ctx.fillText("NOXA MEETS", 72, 280);
    ctx.font = "800 92px system-ui,sans-serif";
    wrapText(ctx, eventTitle, 930).forEach((line, index) => ctx.fillText(line, 72, 520 + index * 108));
    ctx.fillStyle = "#a1a1a6";
    ctx.font = "500 42px system-ui,sans-serif";
    const date = new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Athens",
    }).format(new Date(startsAt));
    ctx.fillText(date, 72, 1100);
    wrapText(ctx, location, 900).slice(0, 2).forEach((line, index) => ctx.fillText(line, 72, 1190 + index * 58));
    ctx.fillStyle = "#e32c49";
    ctx.font = "700 34px system-ui,sans-serif";
    ctx.fillText("noxastreetapp.com", 72, 1750);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.94));
    if (!blob) return;
    const file = new File([blob], "noxa-meet-story.png", { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: eventTitle });
        return;
      }
    } catch {
      // Fall back to download.
    }
    download("noxa-meet-story.png", blob);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setReportState("sending");
    setReportMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/meets/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          reason: String(form.get("reason") || ""),
          details: String(form.get("details") || ""),
          email: String(form.get("email") || ""),
          website: String(form.get("website") || ""),
        }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Request failed");
      setReportState("success");
      setReportMessage(t.sent);
      formElement.reset();
    } catch (error) {
      setReportState("error");
      setReportMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <>
      <div className={styles.actions}>
        <button className={styles.primaryAction} onClick={openMap} type="button">{t.map}</button>
        <button className={styles.secondaryAction} onClick={toggleSave} type="button">{saved ? `♥ ${t.saved}` : `♡ ${t.save}`}</button>
        <button className={styles.secondaryAction} onClick={() => void share()} type="button">{shared ? t.copied : t.share}</button>
        <button className={styles.secondaryAction} onClick={downloadIcs} type="button">{t.calendar}</button>
        <button className={styles.secondaryAction} onClick={googleCalendar} type="button">{t.google}</button>
        <button className={styles.secondaryAction} onClick={() => void storyCard()} type="button">{t.story}</button>
        <button className={styles.textAction} onClick={() => setReportOpen(true)} type="button">{t.report}</button>
      </div>
      {reportOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}>
          <div className={styles.reportModal} role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className={styles.modalHeader}><h2 id="report-title">{t.reportTitle}</h2><button type="button" onClick={() => setReportOpen(false)} aria-label={t.close}>×</button></div>
            <form onSubmit={submitReport}>
              <label><span>{t.reason}</span><select name="reason" required defaultValue=""><option value="" disabled>—</option>{Object.entries(t.reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>{t.details}</span><textarea name="details" maxLength={1500} rows={4} /></label>
              <label><span>{t.email}</span><input name="email" type="email" maxLength={254} /></label>
              <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button className={styles.primaryAction} disabled={reportState === "sending"} type="submit">{reportState === "sending" ? t.sending : t.send}</button>
              {reportMessage ? <p className={reportState === "error" ? styles.reportError : styles.reportStatus} role="status">{reportMessage}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
