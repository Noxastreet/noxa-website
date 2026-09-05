export const SAVED_EVENTS_KEY = "noxa.savedEvents.v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readSavedEvents(storage: StorageLike) {
  try {
    const raw = storage.getItem(SAVED_EVENTS_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function toggleSavedEvent(storage: StorageLike, eventId: string) {
  const values = new Set(readSavedEvents(storage));
  if (values.has(eventId)) values.delete(eventId);
  else values.add(eventId);
  const next = [...values];
  storage.setItem(SAVED_EVENTS_KEY, JSON.stringify(next));
  return next.includes(eventId);
}
