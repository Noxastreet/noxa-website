"use client";

import { FormEvent, useRef, useState } from "react";

type SubmissionState =
  | "idle"
  | "submitting"
  | "success"
  | "already-joined"
  | "error";

type ApiResponse = {
  ok?: boolean;
  alreadyJoined?: boolean;
  code?: string;
};

const errorMessages: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  consent_required: "Consent is required to join the early-access list.",
  invalid_submission_timing: "Please review the form and try again.",
  rate_limited: "Too many attempts. Please try again in a few minutes.",
  service_unavailable: "Early access is temporarily unavailable.",
  submission_failed: "We could not save your request. Please try again.",
};

export function WaitlistForm() {
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(window.location.search);

    setState("submitting");
    setMessage("Joining the NOXA early-access list…");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          city: formData.get("city"),
          consent: formData.get("consent") === "on",
          website: formData.get("website"),
          startedAt: startedAt.current,
          locale: document.documentElement.lang === "el" ? "el" : "en",
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
          utmContent: searchParams.get("utm_content"),
          referrer: document.referrer || null,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.code || "submission_failed");
      }

      if (result.alreadyJoined) {
        setState("already-joined");
        setMessage("You are already on the NOXA early-access list.");
      } else {
        setState("success");
        setMessage("You’re in. We’ll contact you when NOXA early access opens.");
      }

      form.reset();
    } catch (error) {
      const code = error instanceof Error ? error.message : "submission_failed";

      setState("error");
      setMessage(errorMessages[code] ?? errorMessages.submission_failed);
      startedAt.current = Date.now();
    }
  }

  const isSubmitting = state === "submitting";
  const isComplete = state === "success" || state === "already-joined";

  return (
    <form className="mt-9 max-w-2xl" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isSubmitting || isComplete}
            placeholder="you@example.com"
            className="min-h-14 w-full rounded-2xl border border-white/20 bg-black/20 px-5 text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/70 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-65"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
            City <span className="normal-case tracking-normal text-white/40">optional</span>
          </span>
          <input
            name="city"
            type="text"
            autoComplete="address-level2"
            maxLength={80}
            disabled={isSubmitting || isComplete}
            placeholder="Thessaloniki"
            className="min-h-14 w-full rounded-2xl border border-white/20 bg-black/20 px-5 text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/70 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-65"
          />
        </label>
      </div>

      <div
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/15 bg-black/10 p-4">
        <input
          name="consent"
          type="checkbox"
          required
          disabled={isSubmitting || isComplete}
          className="mt-0.5 size-5 shrink-0 accent-black"
        />
        <span className="text-sm leading-6 text-white/68">
          I agree that NOXA may store my email and city to send early-access
          updates. I can unsubscribe at any time.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting || isComplete}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-7 font-semibold text-black outline-none transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-black/45"
        >
          {isSubmitting
            ? "Joining…"
            : isComplete
              ? "Joined"
              : "Join NOXA"}
        </button>

        <p
          className={`min-h-6 text-sm leading-6 ${
            state === "error" ? "text-white" : "text-white/68"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </form>
  );
}
