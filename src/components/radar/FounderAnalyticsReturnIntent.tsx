"use client";

import { useEffect } from "react";

import {
  RADAR_ADMIN_SESSION_KEY,
  type RadarAdminSession,
} from "@/lib/radarAdminSession";

const RETURN_TO_KEY = "noxa-radar-admin-return-to-v1";
const ANALYTICS_PATH = "/radar/admin/analytics";

/**
 * Remembers the Analytics destination only when there is no recoverable Radar
 * Admin session. An expired access token with a refresh token is intentionally
 * treated as recoverable; Founder Analytics will refresh it automatically.
 */
export function FounderAnalyticsReturnIntent() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RADAR_ADMIN_SESSION_KEY);
      const session = raw ? JSON.parse(raw) as Partial<RadarAdminSession> : null;
      const canRecover = Boolean(session?.accessToken && session?.refreshToken);

      if (canRecover) {
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
