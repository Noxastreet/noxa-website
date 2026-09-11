"use client";

import { useEffect } from "react";

const SESSION_KEY = "noxa-radar-admin-session-v1";
const RETURN_TO_KEY = "noxa-radar-admin-return-to-v1";
const ANALYTICS_PATH = "/radar/admin/analytics";

type StoredSession = {
  accessToken?: string;
  expiresAt?: number;
};

/**
 * Remembers that an unauthenticated founder came from Analytics. The intent
 * survives Supabase falling back to the Site URL before Radar Admin restores
 * the authenticated session.
 */
export function FounderAnalyticsReturnIntent() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) as StoredSession : null;
      const sessionIsUsable = Boolean(
        session?.accessToken && (!session.expiresAt || session.expiresAt > Date.now()),
      );

      if (sessionIsUsable) {
        window.localStorage.removeItem(RETURN_TO_KEY);
        return;
      }

      window.localStorage.setItem(RETURN_TO_KEY, ANALYTICS_PATH);
    } catch {
      window.localStorage.setItem(RETURN_TO_KEY, ANALYTICS_PATH);
    }
  }, []);

  return null;
}
