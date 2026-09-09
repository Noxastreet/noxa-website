"use client";

import { useEffect, useState } from "react";

import { readSavedEvents, toggleSavedEvent } from "@/lib/meets/savedEvents";

import styles from "./MeetsDiscovery.module.css";

export const SAVED_EVENT_CHANGE = "noxa:saved-event-change";

export function SavedEventButton({ eventId, locale, compact = false }: { eventId: string; locale: "en" | "el"; compact?: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readSavedEvents(window.localStorage).includes(eventId));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SAVED_EVENT_CHANGE, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SAVED_EVENT_CHANGE, sync);
    };
  }, [eventId]);

  function toggle() {
    const next = toggleSavedEvent(window.localStorage, eventId);
    setSaved(next);
    window.dispatchEvent(new CustomEvent(SAVED_EVENT_CHANGE, { detail: { eventId, saved: next } }));
  }

  const label = saved
    ? (locale === "el" ? "Αποθηκεύτηκε" : "Saved")
    : (locale === "el" ? "Αποθήκευση" : "Save");

  return (
    <button
      type="button"
      className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""} ${compact ? styles.saveButtonCompact : ""}`}
      aria-pressed={saved}
      aria-label={label}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.saveIcon}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
      {compact ? null : <span>{label}</span>}
    </button>
  );
}
