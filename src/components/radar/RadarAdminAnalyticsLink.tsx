"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Keeps the existing Radar Admin layout untouched while placing the Analytics
 * action inside its current header action group, so it inherits the same
 * button styling and responsive behavior as Refresh / Exit.
 */
export function RadarAdminAnalyticsLink() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const refreshButton = Array.from(document.querySelectorAll("header button"))
      .find((button) => button.textContent?.trim() === "Refresh");
    setTarget(refreshButton?.parentElement ?? null);
  }, []);

  if (!target) return null;

  return createPortal(
    <button
      aria-label="Открыть Founder Analytics"
      onClick={() => window.location.assign("/radar/admin/analytics")}
      type="button"
    >
      Аналитика
    </button>,
    target,
  );
}
