"use client";

import { useEffect } from "react";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

/**
 * Supabase falls back to the configured Site URL when a requested magic-link
 * redirect is not allow-listed. Radar Admin normally asks for /radar/admin,
 * but a fallback can therefore land on `/` with the auth session in the hash.
 *
 * This bridge only forwards that hash after the authenticated user proves to
 * be a Radar admin. Non-admin Supabase sessions remain on the public site.
 */
export function RadarAdminAuthBridge() {
  useEffect(() => {
    let cancelled = false;

    async function recoverAdminCallback() {
      if (!window.location.hash) return;

      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) return;

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: "{}",
          cache: "no-store",
        });

        if (cancelled || !response.ok || await response.json() !== true) return;

        // Preserve the fragment: RadarAdminSimpleConsole validates the user,
        // stores the session, and removes the tokens from the address bar.
        window.location.replace(`/radar/admin${window.location.hash}`);
      } catch {
        // A failed privilege check must never redirect or expose the session.
      }
    }

    void recoverAdminCallback();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
