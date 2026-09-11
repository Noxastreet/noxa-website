"use client";

import { useEffect } from "react";

/**
 * Supabase may fall back to the configured Site URL when a requested magic-link
 * redirect is not allow-listed. In that case the auth session lands on `/` in
 * the URL fragment. Only consume that callback when auth tokens are present.
 * The admin helper is lazy-loaded so normal public homepage visits do not pay
 * for private auth/session code.
 */
export function RadarAdminAuthBridge() {
  useEffect(() => {
    let cancelled = false;

    async function recoverAdminCallback() {
      if (!window.location.hash.includes("access_token=") || !window.location.hash.includes("refresh_token=")) {
        return;
      }

      try {
        const {
          consumeRadarAdminReturnIntent,
          RADAR_ADMIN_ANALYTICS_PATH,
          resolveRadarAdminSession,
        } = await import("@/lib/radarAdminSession");

        const result = await resolveRadarAdminSession({
          consumeMagicLink: true,
          verifyAdmin: true,
        });
        if (cancelled || result.status !== "authorized") return;

        const requestedDestination = consumeRadarAdminReturnIntent();
        const destination = requestedDestination === RADAR_ADMIN_ANALYTICS_PATH
          ? RADAR_ADMIN_ANALYTICS_PATH
          : "/radar/admin";
        window.location.replace(destination);
      } catch {
        // Keep the public page usable when auth recovery is temporarily unavailable.
      }
    }

    void recoverAdminCallback();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
