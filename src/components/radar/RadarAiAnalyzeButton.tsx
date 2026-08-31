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

  if (/valid credit card|add-credit-card|unlock your free credits/i.test(value)) {
    return "AI Gateway needs a billing method in Vercel. Add a valid card in Vercel → AI Gateway, then try again.";
  }

  if (/authentication is not available|authentication is unavailable|OIDC token/i.test(value)) {
    return "AI Gateway authentication is unavailable in this deployment.";
  }

  if (value && value.length <= 220) return value;
  return `AI analysis failed (${status}).`;
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
      setMessage("Admin session expired. Sign in again.");
      return null;
    }
    return accessToken;
  }

  async function runCollector() {
    const accessToken = requireAccessToken();
    if (!accessToken) return;

    setBusyAction("collector");
    setIsError(false);
    setMessage("Checking active Radar sources…");

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/radar-collector`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "manual" }),
      });
      const payload = await response.json().catch(() => ({})) as CollectorResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? `Collector failed (${response.status}).`);
      }

      const sources = payload.sourcesChecked ?? 0;
      const created = payload.candidatesCreated ?? 0;
      const duplicates = payload.duplicatesSkipped ?? 0;
      setMessage(`Checked ${sources} source${sources === 1 ? "" : "s"} · ${created} new · ${duplicates} duplicate${duplicates === 1 ? "" : "s"}. Refreshing…`);
      window.setTimeout(() => window.location.reload(), 1100);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Collector failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function analyze() {
    const accessToken = requireAccessToken();
    if (!accessToken) return;

    setBusyAction("ai");
    setIsError(false);
    setMessage("Analyzing the next batch…");

    try {
      const response = await fetch("/api/radar/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json().catch(() => ({})) as AnalyzeResponse;

      if (!response.ok) {
        throw new Error(friendlyAnalyzeError(payload.error, response.status));
      }

      if ((payload.analyzed ?? 0) === 0) {
        setMessage("No unanalyzed candidates left.");
        return;
      }

      setMessage(`AI analyzed ${payload.analyzed} candidate${payload.analyzed === 1 ? "" : "s"}. Refreshing…`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "AI analysis failed.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.wrap}>
      {message ? (
        <div className={`${styles.status} ${isError ? styles.error : ""}`} role="status">
          {message}
        </div>
      ) : null}
      <div className={styles.actions}>
        <button disabled={busyAction !== null} onClick={() => void runCollector()} type="button">
          <span aria-hidden="true">↻</span>
          {busyAction === "collector" ? "Scanning…" : "Run collector"}
        </button>
        <button className={styles.aiButton} disabled={busyAction !== null} onClick={() => void analyze()} type="button">
          <span aria-hidden="true">✦</span>
          {busyAction === "ai" ? "AI analyzing…" : "AI analyze"}
        </button>
      </div>
    </div>
  );
}
