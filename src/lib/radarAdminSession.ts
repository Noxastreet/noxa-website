"use client";

import {
  RADAR_SUPABASE_PUBLISHABLE_KEY,
  RADAR_SUPABASE_URL,
} from "@/lib/radarSupabasePublic";

export const RADAR_ADMIN_SESSION_KEY = "noxa-radar-admin-session-v1";
export const RADAR_ADMIN_RETURN_TO_KEY = "noxa-radar-admin-return-to-v1";
export const RADAR_ADMIN_ANALYTICS_PATH = "/radar/admin/analytics";

const REFRESH_EARLY_MS = 60_000;

type AuthUser = {
  id?: string;
  email?: string;
};

export type RadarAdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  userId: string;
};

export type RadarAdminSessionResolution =
  | { status: "authorized"; session: RadarAdminSession }
  | { status: "signed_out"; session: null }
  | { status: "unauthorized"; session: null };

type AccessCheck =
  | { status: "authorized"; user: Required<Pick<AuthUser, "id" | "email">> }
  | { status: "invalid" }
  | { status: "unauthorized" }
  | { status: "error" };

type MagicLinkTokens = Pick<RadarAdminSession, "accessToken" | "refreshToken" | "expiresAt">;

function authHeaders(accessToken?: string) {
  return {
    apikey: RADAR_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function isSessionShape(value: unknown): value is RadarAdminSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<RadarAdminSession>;
  return Boolean(
    session.accessToken &&
    session.refreshToken &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt) &&
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
    if (!isSessionShape(parsed)) {
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

export function clearRadarAdminReturnIntent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RADAR_ADMIN_RETURN_TO_KEY);
}

export function rememberRadarAdminReturnIntent(path: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RADAR_ADMIN_RETURN_TO_KEY, path);
}

export function consumeRadarAdminReturnIntent() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(RADAR_ADMIN_RETURN_TO_KEY);
  window.localStorage.removeItem(RADAR_ADMIN_RETURN_TO_KEY);
  return value;
}

function parseMagicLinkTokens(): MagicLinkTokens | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = Number(params.get("expires_in") ?? "3600");
  if (!accessToken || !refreshToken) return null;

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );

  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Math.max(60, Number.isFinite(expiresIn) ? expiresIn : 3600) * 1_000,
  };
}

async function checkRadarAdminAccess(accessToken: string): Promise<AccessCheck> {
  const headers = authHeaders(accessToken);
  try {
    const [userResponse, adminResponse] = await Promise.all([
      fetch(`${RADAR_SUPABASE_URL}/auth/v1/user`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${RADAR_SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
        method: "POST",
        headers,
        body: "{}",
        cache: "no-store",
      }),
    ]);

    if (userResponse.status === 401 || adminResponse.status === 401) {
      return { status: "invalid" };
    }
    if (!userResponse.ok || !adminResponse.ok) {
      return { status: "error" };
    }

    const user = await userResponse.json() as AuthUser;
    const isAdmin = await adminResponse.json();
    if (!user.id || !user.email) return { status: "invalid" };
    if (isAdmin !== true) return { status: "unauthorized" };

    return {
      status: "authorized",
      user: { id: user.id, email: user.email },
    };
  } catch {
    return { status: "error" };
  }
}

async function refreshWithToken(refreshToken: string): Promise<RadarAdminSessionResolution> {
  let response: Response;
  try {
    response = await fetch(`${RADAR_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    throw new Error("RADAR_ADMIN_REFRESH_UNAVAILABLE");
  }

  if (!response.ok) {
    storeRadarAdminSession(null);
    return { status: "signed_out", session: null };
  }

  const payload = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: AuthUser;
  };

  if (!payload.access_token || !payload.refresh_token || !payload.user?.id || !payload.user.email) {
    storeRadarAdminSession(null);
    return { status: "signed_out", session: null };
  }

  const checked = await checkRadarAdminAccess(payload.access_token);
  if (checked.status === "error") throw new Error("RADAR_ADMIN_STATUS_UNAVAILABLE");
  if (checked.status !== "authorized") {
    storeRadarAdminSession(null);
    return checked.status === "unauthorized"
      ? { status: "unauthorized", session: null }
      : { status: "signed_out", session: null };
  }

  const expiresIn = Number(payload.expires_in ?? 3600);
  const session: RadarAdminSession = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(60, Number.isFinite(expiresIn) ? expiresIn : 3600) * 1_000,
    email: checked.user.email,
    userId: checked.user.id,
  };
  storeRadarAdminSession(session);
  return { status: "authorized", session };
}

async function resolveMagicLinkSession(tokens: MagicLinkTokens): Promise<RadarAdminSessionResolution> {
  const checked = await checkRadarAdminAccess(tokens.accessToken);
  if (checked.status === "error") throw new Error("RADAR_ADMIN_STATUS_UNAVAILABLE");
  if (checked.status !== "authorized") {
    storeRadarAdminSession(null);
    return checked.status === "unauthorized"
      ? { status: "unauthorized", session: null }
      : { status: "signed_out", session: null };
  }

  const session: RadarAdminSession = {
    ...tokens,
    email: checked.user.email,
    userId: checked.user.id,
  };
  storeRadarAdminSession(session);
  return { status: "authorized", session };
}

export async function resolveRadarAdminSession(options?: {
  consumeMagicLink?: boolean;
  forceRefresh?: boolean;
  verifyAdmin?: boolean;
}): Promise<RadarAdminSessionResolution> {
  const consumeMagicLink = options?.consumeMagicLink ?? false;
  const forceRefresh = options?.forceRefresh ?? false;
  const verifyAdmin = options?.verifyAdmin ?? true;

  if (consumeMagicLink) {
    const magic = parseMagicLinkTokens();
    if (magic) return resolveMagicLinkSession(magic);
  }

  const stored = readRadarAdminSession();
  if (!stored) return { status: "signed_out", session: null };

  if (forceRefresh || stored.expiresAt <= Date.now() + REFRESH_EARLY_MS) {
    return refreshWithToken(stored.refreshToken);
  }

  if (!verifyAdmin) return { status: "authorized", session: stored };

  const checked = await checkRadarAdminAccess(stored.accessToken);
  if (checked.status === "authorized") {
    const session: RadarAdminSession = {
      ...stored,
      email: checked.user.email,
      userId: checked.user.id,
    };
    storeRadarAdminSession(session);
    return { status: "authorized", session };
  }
  if (checked.status === "error") throw new Error("RADAR_ADMIN_STATUS_UNAVAILABLE");
  if (checked.status === "unauthorized") {
    storeRadarAdminSession(null);
    return { status: "unauthorized", session: null };
  }

  return refreshWithToken(stored.refreshToken);
}

export async function signOutRadarAdmin(session?: RadarAdminSession | null) {
  try {
    if (session?.accessToken) {
      await fetch(`${RADAR_SUPABASE_URL}/auth/v1/logout?scope=local`, {
        method: "POST",
        headers: authHeaders(session.accessToken),
        cache: "no-store",
      });
    }
  } finally {
    storeRadarAdminSession(null);
    clearRadarAdminReturnIntent();
  }
}
