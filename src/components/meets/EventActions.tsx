"use client";

import { FormEvent, useEffect, useState } from "react";

import styles from "./EventDetailPage.module.css";

const TRACK_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/event-track";
const SAVED_KEY = "noxa.savedEvents.v1";

type Props = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  locationLabel: string;
  organizerName: string;
  mapQuery: string;
  locale: "en" | "el";
  isPast?: boolean;
};

type MetricKind = "view" | "share" | "map_click";
type ReportState = "idle" | "sending" | "sent" | "error";

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
  } catch { return "other"; }
}

function track(eventId: string, kind: MetricKind, source = "direct") {
  return fetch(TRACK_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, kind, source }), keepalive: true }).catch(() => undefined);
}

function loadSaved(eventId: string) {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.includes(eventId);
  } catch { return false; }
}

function icsDate(value: string) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
function icsEscape(value: string) { return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); }
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) current = test;
    else { lines.push(current); current = word; if (lines.length === maxLines - 1) break; }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.join(" ").length < text.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/…$/, "")}…`;
  return lines;
}

export function EventActions({ eventId, eventTitle, eventType, startsAt, endsAt, locationLabel, organizerName, mapQuery, locale, isPast = false }: Props) {
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(() => loadSaved(eventId));
  const [storyBusy, setStoryBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, setReportState] = useState<ReportState>("idle");

  useEffect(() => { void track(eventId, "view", trafficSource()); }, [eventId]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: eventTitle, url });
      else { await navigator.clipboard.writeText(url); setShared(true); window.setTimeout(() => setShared(false), 1800); }
      void track(eventId, "share");
    } catch { /* dismissed share sheet */ }
  }

  function toggleSave() {
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const next = new Set<string>(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
      if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(next)));
      setSaved(next.has(eventId));
    } catch { setSaved((value) => !value); }
  }

  function openMap() { void track(eventId, "map_click"); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`, "_blank", "noopener,noreferrer"); }

  function addCalendar() {
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const body = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//NOXA//Meets//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${eventId}@noxastreetapp.com`,`DTSTAMP:${icsDate(new Date().toISOString())}`,`DTSTART:${icsDate(start.toISOString())}`,`DTEND:${icsDate(end.toISOString())}`,`SUMMARY:${icsEscape(eventTitle)}`,`LOCATION:${icsEscape(locationLabel)}`,`DESCRIPTION:${icsEscape(`NOXA Meets · ${organizerName}\n${window.location.href}`)}`,`URL:${window.location.href}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
    const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "noxa-event"}.ics`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function shareStory() {
    setStoryBusy(true);
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920; const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1000); gradient.addColorStop(0, "#c8102e"); gradient.addColorStop(.45, "#26080e"); gradient.addColorStop(1, "#050505"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(72, 1120, 936, 1);
      const logo = new Image(); logo.src = "/brand/noxa-maps-logo.png"; await new Promise<void>((resolve) => { logo.onload = () => resolve(); logo.onerror = () => resolve(); }); if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, 72, 92, 520, 133);
      ctx.fillStyle = "#e32c49"; ctx.font = "800 30px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText(`NOXA MEETS · ${eventType.replaceAll("_", " ").toUpperCase()}`, 72, 420);
      ctx.fillStyle = "#ffffff"; ctx.font = "800 78px -apple-system, BlinkMacSystemFont, sans-serif"; wrapCanvasText(ctx, eventTitle, 910, 5).forEach((line, index) => ctx.fillText(line, 72, 530 + index * 92));
      const date = new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(startsAt));
      ctx.fillStyle = "#ffffff"; ctx.font = "750 42px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText(date, 72, 1240);
      ctx.fillStyle = "#b9bac0"; ctx.font = "500 34px -apple-system, BlinkMacSystemFont, sans-serif"; wrapCanvasText(ctx, locationLabel, 900, 2).forEach((line, index) => ctx.fillText(line, 72, 1320 + index * 48));
      ctx.fillStyle = "#8c8e94"; ctx.font = "600 28px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText(`Organized by ${organizerName}`, 72, 1490);
      ctx.fillStyle = "#ffffff"; ctx.font = "800 38px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText("noxastreetapp.com/meets", 72, 1780);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", .95)); if (!blob) return;
      const file = new File([blob], "noxa-meet-story.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: eventTitle });
      else { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "noxa-meet-story.png"; anchor.click(); URL.revokeObjectURL(url); }
      void track(eventId, "share");
    } catch { /* cancelled */ } finally { setStoryBusy(false); }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setReportState("sending"); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/meets/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, reason: form.get("reason"), details: form.get("details"), email: form.get("email") }) });
      if (!response.ok) throw new Error("report failed"); setReportState("sent");
    } catch { setReportState("error"); }
  }

  const labels = locale === "el" ? { map: "Άνοιξε Χάρτη", share: "Κοινοποίηση", copied: "Αντιγράφηκε", save: "Αποθήκευση", saved: "Αποθηκεύτηκε", calendar: "Ημερολόγιο", story: "Story Card", storyBusy: "Δημιουργία…", report: "Λάθος πληροφορίες;", reason: "Τι είναι λάθος;", details: "Λεπτομέρειες", email: "Email (προαιρετικό)", send: "Στείλε διόρθωση", sent: "Ευχαριστούμε. Θα το ελέγξουμε.", error: "Δεν στάλθηκε. Δοκίμασε ξανά.", reasons: [["time","Ημερομηνία / ώρα"],["location","Τοποθεσία"],["cancelled","Ακυρώθηκε"],["duplicate","Διπλό event"],["other","Άλλο"]] }
  : { map: "Open Map", share: "Share", copied: "Copied", save: "Save", saved: "Saved", calendar: "Add to Calendar", story: "Story Card", storyBusy: "Creating…", report: "Something wrong?", reason: "What needs correcting?", details: "Details", email: "Email (optional)", send: "Send correction", sent: "Thanks. NOXA will review it.", error: "Could not send. Try again.", reasons: [["time","Date / time"],["location","Location"],["cancelled","Event cancelled"],["duplicate","Duplicate event"],["other","Other"]] };

  return <>
    <div className={styles.actions}>
      {!isPast ? <button className={styles.primaryAction} onClick={openMap} type="button">{labels.map}</button> : null}
      <button className={styles.secondaryAction} onClick={() => void share()} type="button">{shared ? labels.copied : labels.share}</button>
      <button className={saved ? styles.savedAction : styles.secondaryAction} onClick={toggleSave} type="button">{saved ? `★ ${labels.saved}` : `☆ ${labels.save}`}</button>
      {!isPast ? <button className={styles.secondaryAction} onClick={addCalendar} type="button">＋ {labels.calendar}</button> : null}
      <button className={styles.secondaryAction} disabled={storyBusy} onClick={() => void shareStory()} type="button">{storyBusy ? labels.storyBusy : labels.story}</button>
    </div>
    <div className={styles.reportWrap}><button className={styles.reportToggle} type="button" onClick={() => setReportOpen((value) => !value)}>{labels.report} →</button>
      {reportOpen ? <form className={styles.reportForm} onSubmit={(event) => void submitReport(event)}><label><span>{labels.reason}</span><select name="reason" defaultValue="time">{labels.reasons.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><label><span>{labels.details}</span><textarea name="details" maxLength={800} rows={3} required /></label><label><span>{labels.email}</span><input name="email" type="email" maxLength={254} /></label><button type="submit" disabled={reportState === "sending"}>{labels.send}</button>{reportState === "sent" ? <p>{labels.sent}</p> : null}{reportState === "error" ? <p className={styles.reportError}>{labels.error}</p> : null}</form> : null}
    </div>
  </>;
}
