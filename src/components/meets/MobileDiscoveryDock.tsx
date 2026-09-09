"use client";

import styles from "./MeetsDiscovery.module.css";

export function MobileDiscoveryDock({
  locale,
  nearbyActive,
  weekendActive,
  savedActive,
  savedCount,
  onNearby,
  onWeekend,
  onSaved,
  onFilters,
}: {
  locale: "en" | "el";
  nearbyActive: boolean;
  weekendActive: boolean;
  savedActive: boolean;
  savedCount: number;
  onNearby: () => void;
  onWeekend: () => void;
  onSaved: () => void;
  onFilters: () => void;
}) {
  const t = locale === "el"
    ? { near: "Κοντά", weekend: "Weekend", saved: "Saved", filters: "Φίλτρα" }
    : { near: "Near", weekend: "Weekend", saved: "Saved", filters: "Filters" };

  return (
    <nav className={styles.mobileDock} aria-label={locale === "el" ? "Γρήγορη ανακάλυψη" : "Quick discovery"}>
      <button className={nearbyActive ? styles.mobileDockActive : ""} type="button" aria-pressed={nearbyActive} onClick={onNearby}>
        <strong aria-hidden="true">⌖</strong><span>{t.near}</span>
      </button>
      <button className={weekendActive ? styles.mobileDockActive : ""} type="button" aria-pressed={weekendActive} onClick={onWeekend}>
        <strong aria-hidden="true">◫</strong><span>{t.weekend}</span>
      </button>
      <button className={savedActive ? styles.mobileDockActive : ""} type="button" aria-pressed={savedActive} onClick={onSaved}>
        <strong aria-hidden="true">♥</strong><span>{t.saved}{savedCount ? ` ${savedCount}` : ""}</span>
      </button>
      <button type="button" onClick={onFilters}>
        <strong aria-hidden="true">≡</strong><span>{t.filters}</span>
      </button>
    </nav>
  );
}
