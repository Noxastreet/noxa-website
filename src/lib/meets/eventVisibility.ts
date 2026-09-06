const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export type EventEndSource = "provided" | "fallback";

export type EventInterval = {
  startMs: number;
  endMs: number;
  endSource: EventEndSource;
};

export function eventInterval(startsAt: string, endsAt: string | null): EventInterval | null {
  const startMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startMs)) return null;

  if (endsAt) {
    const endMs = new Date(endsAt).getTime();
    if (Number.isFinite(endMs) && endMs >= startMs) {
      return { startMs, endMs, endSource: "provided" };
    }
  }

  return { startMs, endMs: startMs + DEFAULT_EVENT_DURATION_MS, endSource: "fallback" };
}

export function eventEndsAt(startsAt: string, endsAt: string | null) {
  return eventInterval(startsAt, endsAt)?.endMs ?? Number.NaN;
}

export function isEventCurrentlyVisible(startsAt: string, endsAt: string | null, now = Date.now()) {
  const interval = eventInterval(startsAt, endsAt);
  return interval !== null && interval.endMs >= now;
}

export function isEventHappeningNow(startsAt: string, endsAt: string | null, now = Date.now()) {
  const interval = eventInterval(startsAt, endsAt);
  return interval !== null && interval.startMs <= now && interval.endMs >= now;
}

export function isPastEvent(startsAt: string, endsAt: string | null, now = Date.now()) {
  const interval = eventInterval(startsAt, endsAt);
  return interval !== null && interval.endMs < now;
}

export function eventEndIso(startsAt: string, endsAt: string | null) {
  const interval = eventInterval(startsAt, endsAt);
  return interval ? new Date(interval.endMs).toISOString() : startsAt;
}
