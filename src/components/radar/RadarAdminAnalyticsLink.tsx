"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps the existing Radar Admin layout untouched while placing the Analytics
 * action inside its current header action group, so it inherits the same
 * button styling and responsive behavior as Refresh / Exit.
 */
export function RadarAdminAnalyticsLink() {
  const router = useRouter();

  useEffect(() => {
    const refreshButton = Array.from(document.querySelectorAll("header button"))
      .find((button) => button.textContent?.trim() === "Refresh");
    const target = refreshButton?.parentElement;
    if (!target || target.querySelector('[data-founder-analytics-link="true"]')) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Аналитика";
    button.setAttribute("aria-label", "Открыть Founder Analytics");
    button.dataset.founderAnalyticsLink = "true";

    const openAnalytics = () => router.push("/radar/admin/analytics");
    button.addEventListener("click", openAnalytics);
    target.insertBefore(button, refreshButton ?? null);

    return () => {
      button.removeEventListener("click", openAnalytics);
      button.remove();
    };
  }, [router]);

  return null;
}
