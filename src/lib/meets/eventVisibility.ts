const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;
const POST_EVENT_GRACE_MS = 30 * 60 * 1000;

export function eventVisibleUntil(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return Number.NaN;

  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (Number.isFinite(end) && end >= start) return end + POST_EVENT_GRACE_MS;
  }

  return start + DEFAULT_EVENT_DURATION_MS + POST_EVENT_GRACE_MS;
}

export function isEventCurrentlyVisible(startsAt: string, endsAt: string | null, now = Date.now()) {
  const visibleUntil = eventVisibleUntil(startsAt, endsAt);
  return Number.isFinite(visibleUntil) && visibleUntil >= now;
}
