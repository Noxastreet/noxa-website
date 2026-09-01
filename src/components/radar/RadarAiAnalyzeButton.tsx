"use client";

import { useState, useSyncExternalStore } from "react";

import styles from "./RadarAiAnalyzeButton.module.css";

const SESSION_KEY = "noxa-radar-admin-session-v1";
const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

type StoredSession = {
  accessToken?: string;
  expiresAt?: number;
};

type AnalyzeResponse = {
  ok?: boolean;
  analyzed?: number;
  requested?: number;
  pending?: number;
  model?: string;
  error?: string;
};

type CollectorResponse = {
  ok?: boolean;
  status?: string;
  sourcesChecked?: number;
  candidatesCreated?: number;
  duplicatesSkipped?: number;
  errorCount?: number;
  error?: string;
};

function readAccessToken() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (!session.accessToken) return null;
    if (session.expiresAt && session.expiresAt < Date.now()) return null;
    return session.accessToken;
  } catch {
    return null;
  }
}

function subscribeToSession(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getClientSessionSnapshot() {
  return Boolean(readAccessToken());
}

function getServerSessionSnapshot() {
  return false;
}

function friendlyAnalyzeError(message: string | undefined, status: number) {
  const value = message ?? "";

  if (/not configured|GEMINI_API_KEY/i.test(value)) {
    return "Gemini AI is not configured yet.";
  }
  if (/rate limit/i.test(value)) {
    return "Free AI limit reached. Try again later.";
  }
  if (/invalid|does not have access/i.test(value)) {
    return "Gemini access is not available for this key.";
  }
  if (value && value.length <= 220) return value;
  return `AI check failed (${status}).`;
}

async function callCollector(slug: "radar-collector" | "radar-social-collector", accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "manual" }),
  });
  const payload = await response.json().catch(() => ({})) as CollectorResponse;
  if (!response.ok) throw new Error(payload.error ?? `Scan failed (${response.status}).`);
  return payload;
}

export function RadarAiAnalyzeButton() {
  const visible = useSyncExternalStore(
    subscribeToSession,
    getClientSessionSnapshot,
    getServerSessionSnapshot,
  );
  const [busyAction, setBusyAction] = useState<"collector" | "ai" | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function requireAccessToken() {
    const accessToken = readAccessToken();
    if (!accessToken) {
      setIsError(true);
      setMessage("Session expired. Sign in again.");
      return null;
    }
    return accessToken;
  }

  async function runCollector() {
    const accessToken = requireAccessToken();
    if (!accessToken) return;

    setBusyAction("collector");
    setIsError(false);
    setMessage("Scanning websites…");

    try {
      const website = await callCollector("radar-collector", accessToken);
      setMessage("Checking public Instagram / Facebook sources…");
      const social = await callCollector("radar-social-collector", accessToken);

      const sources = (website.sourcesChecked ?? 0) + (social.sourcesChecked ?? 0);
      const created = (website.candidatesCreated ?? 0) + (social.candidatesCreated ?? 0);
      const duplicates = (website.duplicatesSkipped ?? 0) + (social.duplicatesSkipped ?? 0);
      const errors = (website.errorCount ?? 0) + (social.errorCount ?? 0);
      const attention = errors ? ` · ${errors} source${errors === 1 ? "" : "s"} need attention` : "";
      setIsError(errors > 0);
      setMessage(`${sources} sources checked · ${created} new · ${duplicates} already known${attention}. Refreshing…`);
      window.setTimeout(() => window.location.reload(), 1300);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Source scan failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function analyze() {
    const accessToken = requireAccessToken();
    if (!accessToken) return;

    setBusyAction("ai");
    setIsError(false);
    setMessage("AI checking the next events…");

    try {
      const response = await fetch("/api/radar/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json().catch(() => ({})) as AnalyzeResponse;
      if (!response.ok) throw new Error(friendlyAnalyzeError(payload.error, response.status));

      if ((payload.analyzed ?? 0) === 0) {
        setMessage("Everything found so far has already been checked.");
        return;
      }

      setMessage(`AI checked ${payload.analyzed} event${payload.analyzed === 1 ? "" : "s"}. Refreshing…`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "AI check failed.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.wrap}>
      {message ? <div className={`${styles.status} ${isError ? styles.error : ""}`} role="status">{message}</div> : null}
      <div className={styles.actions}>
        <button disabled={busyAction !== null} onClick={() => void runCollector()} type="button">
          <span aria-hidden="true">↻</span>{busyAction === "collector" ? "Scanning…" : "Scan sources"}
        </button>
        <button className={styles.aiButton} disabled={busyAction !== null} onClick={() => void analyze()} type="button">
          <span aria-hidden="true">✦</span>{busyAction === "ai" ? "Checking…" : "AI check"}
        </button>
      </div>
    </div>
  );
}
