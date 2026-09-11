"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

import styles from "./MeetsDiscovery.module.css";

type DockButtonProps = {
  active?: boolean;
  icon: string;
  label: string;
  onActivate: () => void;
};

const dockHitTestStyle: CSSProperties = {
  pointerEvents: "auto",
  isolation: "isolate",
  transform: "translate3d(0, 0, 0)",
  touchAction: "manipulation",
  WebkitBackfaceVisibility: "hidden",
};

const buttonHitTestStyle: CSSProperties = {
  pointerEvents: "auto",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

function DockButton({ active = false, icon, label, onActivate }: DockButtonProps) {
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onActivate();
  }

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    // Pointer/touch activation is handled on pointerup so the gesture cannot be
    // re-targeted to interactive content underneath the fixed dock on iOS.
    // A keyboard/screen-reader generated click has detail === 0.
    if (event.detail === 0) onActivate();
  }

  return (
    <button
      className={active ? styles.mobileDockActive : ""}
      style={buttonHitTestStyle}
      type="button"
      aria-pressed={active}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <strong aria-hidden="true">{icon}</strong><span>{label}</span>
    </button>
  );
}

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
    <nav
      className={styles.mobileDock}
      style={dockHitTestStyle}
      aria-label={locale === "el" ? "Γρήγορη ανακάλυψη" : "Quick discovery"}
    >
      <DockButton active={nearbyActive} icon="⌖" label={t.near} onActivate={onNearby} />
      <DockButton active={weekendActive} icon="◫" label={t.weekend} onActivate={onWeekend} />
      <DockButton active={savedActive} icon="♥" label={`${t.saved}${savedCount ? ` ${savedCount}` : ""}`} onActivate={onSaved} />
      <DockButton icon="≡" label={t.filters} onActivate={onFilters} />
    </nav>
  );
}
