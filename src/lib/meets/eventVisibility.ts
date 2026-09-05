const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export function eventEndsAt(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return Number.NaN;

  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (Number.isFinite(end) && end >= start) return end;
  }

  return start + DEFAULT_EVENT_DURATION_MS;
}

export function isEventCurrentlyVisible(startsAt: string, endsAt: string | null, now = Date.now()) {
  const end = eventEndsAt(startsAt, endsAt);
  return Number.isFinite(end) && end >= now;
}

export function isEventHappeningNow(startsAt: string, endsAt: string | null, now = Date.now()) {
  const start = new Date(startsAt).getTime();
  const end = eventEndsAt(startsAt, endsAt);
  return Number.isFinite(start) && Number.isFinite(end) && start <= now && end >= now;
}

export function isPastEvent(startsAt: string, endsAt: string | null, now = Date.now()) {
  const end = eventEndsAt(startsAt, endsAt);
  return Number.isFinite(end) && end < now;
}

export function eventEndIso(startsAt: string, endsAt: string | null) {
  const end = eventEndsAt(startsAt, endsAt);
  return Number.isFinite(end) ? new Date(end).toISOString() : startsAt;
}
