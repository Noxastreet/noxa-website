"use client";

import { useEffect, useState } from "react";

import styles from "./RadarAiAnalyzeButton.module.css";

const SESSION_KEY = "noxa-radar-admin-session-v1";

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

export function RadarAiAnalyzeButton() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setVisible(Boolean(readAccessToken()));
  }, []);

  async function analyze() {
    const accessToken = readAccessToken();
    if (!accessToken) {
      setIsError(true);
      setMessage("Admin session expired. Sign in again.");
      return;
    }

    setBusy(true);
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
        throw new Error(payload.error ?? `AI analysis failed (${response.status}).`);
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
      setBusy(false);
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
      <button disabled={busy} onClick={() => void analyze()} type="button">
        <span aria-hidden="true">✦</span>
        {busy ? "AI analyzing…" : "AI analyze"}
      </button>
    </div>
  );
}
