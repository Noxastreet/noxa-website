"use client";

import { useEffect } from "react";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-radar-admin-session-v1";
const RETURN_TO_KEY = "noxa-radar-admin-return-to-v1";
const ANALYTICS_PATH = "/radar/admin/analytics";

type AuthUser = {
  id?: string;
  email?: string;
};

/**
 * Supabase falls back to the configured Site URL when a requested magic-link
 * redirect is not allow-listed. Radar Admin normally asks for /radar/admin,
 * but a fallback can therefore land on `/` with the auth session in the hash.
 *
 * This bridge only accepts the session after the authenticated user proves to
 * be a Radar admin. It stores the same Radar Admin session shape used by the
 * console and can safely restore the Founder Analytics destination.
 */
export function RadarAdminAuthBridge() {
  useEffect(() => {
    let cancelled = false;

    async function recoverAdminCallback() {
      if (!window.location.hash) return;

      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = Number(params.get("expires_in") ?? "3600");
      if (!accessToken || !refreshToken) return;

      const headers = {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      try {
        const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
          method: "POST",
          headers,
          body: "{}",
          cache: "no-store",
        });

        if (cancelled || !adminResponse.ok || await adminResponse.json() !== true) return;

        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers,
          cache: "no-store",
        });
        if (cancelled || !userResponse.ok) return;

        const user = await userResponse.json() as AuthUser;
        if (!user.id || !user.email) return;

        window.localStorage.setItem(SESSION_KEY, JSON.stringify({
          accessToken,
          refreshToken,
          expiresAt: Date.now() + Math.max(60, expiresIn) * 1_000,
          email: user.email,
          userId: user.id,
        }));

        const requestedDestination = window.localStorage.getItem(RETURN_TO_KEY);
        const destination = requestedDestination === ANALYTICS_PATH
          ? ANALYTICS_PATH
          : "/radar/admin";
        window.localStorage.removeItem(RETURN_TO_KEY);

        // Do not forward the auth fragment: the validated session is already
        // stored locally, so tokens disappear from the address bar immediately.
        window.location.replace(destination);
      } catch {
        // A failed privilege or user check must never redirect or expose the session.
      }
    }

    void recoverAdminCallback();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
