"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { buildGoogleCalendarUrl, buildIcsCalendar } from "@/lib/meets/calendar";
import { readSavedEvents, toggleSavedEvent } from "@/lib/meets/savedEvents";

import actionStyles from "./EventActionsCleanup.module.css";
import pageStyles from "./EventDetailPage.module.css";

const TRACK_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/event-track";
type MetricKind = "view" | "share" | "map_click";
type IconName = "map" | "heart" | "share" | "calendar" | "download" | "external" | "link" | "story";
type Props = {
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  location: string;
  coverImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: string | null;
  locale: "en" | "el";
};

function Icon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  if (name === "map") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (name === "heart") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true" style={{ fill: filled ? "currentColor" : "none" }}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>;
  if (name === "share") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0 4 4m-4-4L8 7"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>;
  if (name === "calendar") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></svg>;
  if (name === "download") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></svg>;
  if (name === "external") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>;
  if (name === "link") return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>;
  return <svg className={actionStyles.icon} viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="m15.5 7 .6 1.4L17.5 9l-1.4.6-.6 1.4-.6-1.4L13.5 9l1.4-.6.6-1.4Z"/></svg>;
}

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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 4) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.length) {
    const consumed = lines.join(" ").split(/\s+/).length;
    if (consumed < words.length) {
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

function loadStoryImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(value);
    };
    const resolvedUrl = new URL(url, window.location.origin);
    if (resolvedUrl.origin !== window.location.origin) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    const timeout = window.setTimeout(() => finish(null), 4500);
    image.src = resolvedUrl.href;
  });
}

function drawCoverCrop(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = Math.max(0, (image.naturalWidth - sourceWidth) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob(resolve, "image/png", 0.94);
    } catch {
      resolve(null);
    }
  });
}

function renderStoryCanvas({
  eventTitle,
  eventCategory,
  startsAt,
  timezone,
  location,
  locale,
  coverImage,
}: {
  eventTitle: string;
  eventCategory: string;
  startsAt: string;
  timezone: string | null;
  location: string;
  locale: "en" | "el";
  coverImage: HTMLImageElement | null;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 1080, 1920);

  if (coverImage) {
    drawCoverCrop(ctx, coverImage, 0, 0, 1080, 980);
    const imageShade = ctx.createLinearGradient(0, 0, 0, 1060);
    imageShade.addColorStop(0, "rgba(5,5,5,0.10)");
    imageShade.addColorStop(0.55, "rgba(5,5,5,0.34)");
    imageShade.addColorStop(1, "rgba(5,5,5,1)");
    ctx.fillStyle = imageShade;
    ctx.fillRect(0, 0, 1080, 1080);
  } else {
    const ambient = ctx.createRadialGradient(900, 230, 20, 900, 230, 620);
    ambient.addColorStop(0, "rgba(200,16,46,0.34)");
    ambient.addColorStop(0.42, "rgba(200,16,46,0.10)");
    ambient.addColorStop(1, "rgba(5,5,5,0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, 1080, 980);
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let x = -240; x < 1320; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 520, 760);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    ctx.font = "900 520px system-ui,sans-serif";
    ctx.fillText("N", 650, 760);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 46px system-ui,sans-serif";
  ctx.fillText("NOXA", 72, 132);
  ctx.fillStyle = "#e32c49";
  ctx.font = "700 25px system-ui,sans-serif";
  ctx.fillText("MEETS", 238, 130);
  ctx.fillRect(72, 174, 64, 6);

  ctx.font = "700 28px system-ui,sans-serif";
  const categoryWidth = Math.min(430, ctx.measureText(eventCategory).width + 54);
  ctx.fillStyle = "rgba(5,5,5,0.72)";
  ctx.beginPath();
  ctx.roundRect(72, 250, categoryWidth, 58, 29);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#f5f5f7";
  ctx.fillText(eventCategory, 99, 289);

  const titleTop = 990;
  ctx.fillStyle = "#f5f5f7";
  ctx.font = "800 78px system-ui,sans-serif";
  const titleLines = wrapText(ctx, eventTitle, 930, 4);
  titleLines.forEach((line, index) => ctx.fillText(line, 72, titleTop + index * 90));

  const localeCode = locale === "el" ? "el-GR" : "en-GB";
  const eventTimeZone = timezone || "Europe/Athens";
  const dateText = new Intl.DateTimeFormat(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: eventTimeZone,
  }).format(new Date(startsAt));

  const infoTop = Math.max(1440, titleTop + titleLines.length * 90 + 84);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, infoTop - 54);
  ctx.lineTo(1008, infoTop - 54);
  ctx.stroke();

  ctx.strokeStyle = "#e32c49";
  ctx.lineWidth = 4;
  ctx.strokeRect(74, infoTop - 4, 42, 42);
  ctx.beginPath();
  ctx.moveTo(84, infoTop - 14);
  ctx.lineTo(84, infoTop + 2);
  ctx.moveTo(106, infoTop - 14);
  ctx.lineTo(106, infoTop + 2);
  ctx.moveTo(76, infoTop + 8);
  ctx.lineTo(114, infoTop + 8);
  ctx.stroke();
  ctx.fillStyle = "#f5f5f7";
  ctx.font = "600 35px system-ui,sans-serif";
  wrapText(ctx, dateText, 840, 2).forEach((line, index) => ctx.fillText(line, 144, infoTop + 28 + index * 44));

  const locationTop = infoTop + 142;
  ctx.strokeStyle = "#e32c49";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(94, locationTop + 6, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(94, locationTop + 6, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(82, locationTop + 24);
  ctx.lineTo(94, locationTop + 42);
  ctx.lineTo(106, locationTop + 24);
  ctx.stroke();
  ctx.fillStyle = "#a1a1a6";
  ctx.font = "500 34px system-ui,sans-serif";
  wrapText(ctx, location, 840, 2).forEach((line, index) => ctx.fillText(line, 144, locationTop + 22 + index * 43));

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1750);
  ctx.lineTo(1008, 1750);
  ctx.stroke();
  ctx.fillStyle = "#e32c49";
  ctx.font = "700 31px system-ui,sans-serif";
  ctx.fillText("noxastreetapp.com", 72, 1812);
  ctx.fillStyle = "#a1a1a6";
  ctx.font = "600 24px system-ui,sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(locale === "el" ? "ΒΡΕΣ ΤΟ EVENT ΣΤΟ NOXA" : "FIND THE EVENT ON NOXA", 1008, 1810);
  ctx.textAlign = "left";

  return canvas;
}

export function EventActions({ eventId, eventTitle, eventCategory, startsAt, endsAt, timezone, location, coverImageUrl, latitude, longitude, locationPrecision, locale }: Props) {
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [reportMessage, setReportMessage] = useState("");
  const hasExactMap = locationPrecision === "exact" && typeof latitude === "number" && Number.isFinite(latitude) && typeof longitude === "number" && Number.isFinite(longitude);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSaved(readSavedEvents(window.localStorage).includes(eventId));
    });
    void track(eventId, "view", trafficSource());
    return () => window.cancelAnimationFrame(frame);
  }, [eventId]);

  const t = locale === "el" ? {
    map: "Χάρτης", share: "Κοινοποίηση", copied: "Αντιγράφηκε", save: "Αποθήκευση", saved: "Αποθηκεύτηκε",
    calendar: "Ημερολόγιο", apple: "Apple / .ics", google: "Google Calendar", nativeShare: "Κοινοποίηση event", copyLink: "Αντιγραφή link", story: "Story Card", report: "Διόρθωση Event",
    reportTitle: "Αναφορά / διόρθωση", reason: "Λόγος", details: "Λεπτομέρειες (προαιρετικό)", email: "Email (προαιρετικό)",
    send: "Αποστολή", sending: "Αποστολή…", sent: "Η αναφορά αποθηκεύτηκε για έλεγχο.", close: "Κλείσιμο",
    reasons: { time: "Λάθος ημερομηνία/ώρα", location: "Λάθος τοποθεσία", cancelled: "Ακυρώθηκε", duplicate: "Διπλό event", other: "Άλλο" },
  } : {
    map: "Map", share: "Share", copied: "Copied", save: "Save", saved: "Saved",
    calendar: "Calendar", apple: "Apple / .ics", google: "Google Calendar", nativeShare: "Share event", copyLink: "Copy link", story: "Story Card", report: "Correct Event",
    reportTitle: "Report / correct event", reason: "Reason", details: "Details (optional)", email: "Email (optional)",
    send: "Submit", sending: "Sending…", sent: "Report saved for review.", close: "Close",
    reasons: { time: "Wrong date/time", location: "Wrong location", cancelled: "Cancelled", duplicate: "Duplicate", other: "Other" },
  };

  function closeMenus() {
    setShareOpen(false);
    setCalendarOpen(false);
  }

  async function shareEvent() {
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
    } finally {
      setShareOpen(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
      void track(eventId, "share");
    } catch {
      // Clipboard can be unavailable in some embedded browsers.
    } finally {
      setShareOpen(false);
    }
  }

  function openMap() {
    if (!hasExactMap || latitude === null || longitude === null) return;
    void track(eventId, "map_click");
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, "_blank", "noopener,noreferrer");
  }

  function toggleSave() {
    setSaved(toggleSavedEvent(window.localStorage, eventId));
  }

  function downloadIcs() {
    const url = window.location.href;
    const ics = buildIcsCalendar({ id: eventId, title: eventTitle, startsAt, endsAt, location }, url);
    const filename = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "noxa-event";
    download(`${filename}.ics`, new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    setCalendarOpen(false);
  }

  function googleCalendar() {
    window.open(
      buildGoogleCalendarUrl({ id: eventId, title: eventTitle, startsAt, endsAt, location }, window.location.href),
      "_blank",
      "noopener,noreferrer",
    );
    setCalendarOpen(false);
  }

  async function storyCard() {
    setShareOpen(false);
    const coverImage = coverImageUrl ? await loadStoryImage(coverImageUrl) : null;
    let canvas = renderStoryCanvas({ eventTitle, eventCategory, startsAt, timezone, location, locale, coverImage });
    if (!canvas) return;
    let blob = await canvasBlob(canvas);
    if (!blob && coverImage) {
      canvas = renderStoryCanvas({ eventTitle, eventCategory, startsAt, timezone, location, locale, coverImage: null });
      if (!canvas) return;
      blob = await canvasBlob(canvas);
    }
    if (!blob) return;

    const file = new File([blob], "noxa-meet-story.png", { type: "image/png" });
    void track(eventId, "share");
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
      <div className={actionStyles.actions}>
        {(shareOpen || calendarOpen) ? <button className={actionStyles.menuBackdrop} type="button" aria-label={t.close} onClick={closeMenus} /> : null}
        <div className={actionStyles.toolbar}>
          {hasExactMap ? <button className={`${actionStyles.actionButton} ${actionStyles.primary}`} onClick={openMap} type="button"><Icon name="map" />{t.map}</button> : null}
          <button className={`${actionStyles.actionButton} ${actionStyles.secondary} ${saved ? actionStyles.pressed : ""}`} aria-pressed={saved} onClick={toggleSave} type="button"><Icon name="heart" filled={saved} />{saved ? t.saved : t.save}</button>
          <div className={actionStyles.menuWrap}>
            <button className={actionStyles.menuTrigger} aria-expanded={shareOpen} onClick={() => { setShareOpen((open) => !open); setCalendarOpen(false); }} type="button"><Icon name="share" />{shared ? t.copied : t.share}</button>
            {shareOpen ? <div className={actionStyles.menuPanel} role="menu">
              <button className={actionStyles.menuItem} onClick={() => void shareEvent()} role="menuitem" type="button"><span className={actionStyles.menuItemIcon}><Icon name="share" /></span>{t.nativeShare}</button>
              <button className={actionStyles.menuItem} onClick={() => void copyLink()} role="menuitem" type="button"><span className={actionStyles.menuItemIcon}><Icon name="link" /></span>{t.copyLink}</button>
              <button className={actionStyles.menuItem} onClick={() => void storyCard()} role="menuitem" type="button"><span className={actionStyles.menuItemIcon}><Icon name="story" /></span>{t.story}</button>
            </div> : null}
          </div>
          <div className={actionStyles.menuWrap}>
            <button className={actionStyles.menuTrigger} aria-expanded={calendarOpen} onClick={() => { setCalendarOpen((open) => !open); setShareOpen(false); }} type="button"><Icon name="calendar" />{t.calendar}</button>
            {calendarOpen ? <div className={actionStyles.menuPanel} role="menu">
              <button className={actionStyles.menuItem} onClick={downloadIcs} role="menuitem" type="button"><span className={actionStyles.menuItemIcon}><Icon name="download" /></span>{t.apple}</button>
              <button className={actionStyles.menuItem} onClick={googleCalendar} role="menuitem" type="button"><span className={actionStyles.menuItemIcon}><Icon name="external" /></span>{t.google}</button>
            </div> : null}
          </div>
        </div>
        <button className={actionStyles.textAction} onClick={() => setReportOpen(true)} type="button">{t.report}</button>
      </div>
      {reportOpen ? (
        <div className={pageStyles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}>
          <div className={pageStyles.reportModal} role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className={pageStyles.modalHeader}><h2 id="report-title">{t.reportTitle}</h2><button type="button" onClick={() => setReportOpen(false)} aria-label={t.close}>×</button></div>
            <form onSubmit={submitReport}>
              <label><span>{t.reason}</span><select name="reason" required defaultValue=""><option value="" disabled>—</option>{Object.entries(t.reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>{t.details}</span><textarea name="details" maxLength={1500} rows={4} /></label>
              <label><span>{t.email}</span><input name="email" type="email" maxLength={254} /></label>
              <input className={pageStyles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button className={pageStyles.primaryAction} disabled={reportState === "sending"} type="submit">{reportState === "sending" ? t.sending : t.send}</button>
              {reportMessage ? <p className={reportState === "error" ? pageStyles.reportError : pageStyles.reportStatus} role="status">{reportMessage}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
