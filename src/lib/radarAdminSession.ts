import {
  RADAR_SUPABASE_PUBLISHABLE_KEY,
  RADAR_SUPABASE_URL,
} from "@/lib/radarSupabasePublic";

export const RADAR_ADMIN_SESSION_KEY = "noxa-radar-admin-session-v1";

export type RadarAdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  userId: string;
};

type RefreshPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
  };
};

function headers(accessToken?: string) {
  return {
    apikey: RADAR_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function isSession(value: unknown): value is RadarAdminSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<RadarAdminSession>;
  return Boolean(
    session.accessToken &&
    session.refreshToken &&
    typeof session.expiresAt === "number" &&
    session.email &&
    session.userId,
  );
}

export function readRadarAdminSession(): RadarAdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RADAR_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSession(parsed)) {
      window.localStorage.removeItem(RADAR_ADMIN_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(RADAR_ADMIN_SESSION_KEY);
    return null;
  }
}

export function storeRadarAdminSession(session: RadarAdminSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(RADAR_ADMIN_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(RADAR_ADMIN_SESSION_KEY, JSON.stringify(session));
}

async function refreshRadarAdminSession(refreshToken: string): Promise<RadarAdminSession | null> {
  const response = await fetch(`${RADAR_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = await response.json() as RefreshPayload;
  const email = payload.user?.email;
  const userId = payload.user?.id;
  const accessToken = payload.access_token;
  const nextRefreshToken = payload.refresh_token;
  const expiresIn = Number(payload.expires_in ?? 0);

  if (!email || !userId || !accessToken || !nextRefreshToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null;
  }

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    expiresAt: Date.now() + expiresIn * 1_000,
    email,
    userId,
  };
}

export async function verifyRadarAdminAccess(accessToken: string) {
  const response = await fetch(`${RADAR_SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
    method: "POST",
    headers: headers(accessToken),
    body: "{}",
    cache: "no-store",
  });
  return response.ok && await response.json() === true;
}

/**
 * Restores the existing Radar Admin session, refreshing Supabase Auth when the
 * access token is near expiry. Every restored/refreshed session is re-checked
 * against radar_admin_status before it is returned to a private UI.
 */
export async function restoreRadarAdminSession(): Promise<RadarAdminSession | null> {
  let session = readRadarAdminSession();
  if (!session) return null;

  const shouldRefresh = session.expiresAt <= Date.now() + 60_000;
  if (shouldRefresh) {
    session = await refreshRadarAdminSession(session.refreshToken);
    if (!session) {
      storeRadarAdminSession(null);
      return null;
    }
    storeRadarAdminSession(session);
  }

  if (await verifyRadarAdminAccess(session.accessToken)) {
    storeRadarAdminSession(session);
    return session;
  }

  // A token can become invalid before its local expiry (revocation, clock skew,
  // server-side session rotation). Try the existing refresh token once before
  // requiring a new magic link.
  const refreshed = await refreshRadarAdminSession(session.refreshToken);
  if (!refreshed || !(await verifyRadarAdminAccess(refreshed.accessToken))) {
    storeRadarAdminSession(null);
    return null;
  }

  storeRadarAdminSession(refreshed);
  return refreshed;
}
