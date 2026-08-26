"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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

type FieldErrors = {
  email?: string;
  consent?: string;
};

const errorMessages: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  consent_required: "Consent is required to join the early-access list.",
  invalid_submission_timing: "Please review the form and try again.",
  rate_limited: "Too many attempts. Please try again in a few minutes.",
  service_unavailable: "Early access is temporarily unavailable.",
  submission_failed: "We could not save your request. Please try again.",
};

const offlineMessage = "You appear to be offline. Check your connection and try again.";

export function WaitlistForm() {
  const startedAt = useRef(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function focusFirstError(errors: FieldErrors) {
    window.requestAnimationFrame(() => {
      if (errors.email) {
        emailRef.current?.focus();
      } else if (errors.consent) {
        consentRef.current?.focus();
      }
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(window.location.search);
    const nextFieldErrors: FieldErrors = {};

    if (!emailRef.current?.validity.valid) {
      nextFieldErrors.email = errorMessages.invalid_email;
    }

    if (!consentRef.current?.checked) {
      nextFieldErrors.consent = errorMessages.consent_required;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setState("error");
      setMessage("Review the highlighted fields and try again.");
      focusFirstError(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    if (!navigator.onLine) {
      setState("error");
      setMessage(offlineMessage);
      return;
    }

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

      setFieldErrors({});
      form.reset();
    } catch (error) {
      const code = error instanceof Error ? error.message : "submission_failed";
      const nextErrors: FieldErrors = {};

      if (code === "invalid_email") {
        nextErrors.email = errorMessages.invalid_email;
      } else if (code === "consent_required") {
        nextErrors.consent = errorMessages.consent_required;
      }

      setFieldErrors(nextErrors);
      setState("error");
      setMessage(
        !navigator.onLine
          ? offlineMessage
          : (errorMessages[code] ?? errorMessages.submission_failed),
      );
      startedAt.current = Date.now();

      if (Object.keys(nextErrors).length > 0) {
        focusFirstError(nextErrors);
      }
    }
  }

  const isSubmitting = state === "submitting";
  const isComplete = state === "success" || state === "already-joined";
  const emailError = fieldErrors.email;
  const consentError = fieldErrors.consent;

  return (
    <form className="mt-9 max-w-2xl" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold uppercase leading-4 tracking-[0.14em] text-white">
            Email
          </span>
          <input
            ref={emailRef}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            required
            disabled={isSubmitting || isComplete}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "waitlist-email-error" : undefined}
            placeholder="you@example.com"
            className="form-control-scroll min-h-14 w-full min-w-0 rounded-2xl border border-white/30 bg-black/25 px-5 text-base leading-6 text-white transition-colors placeholder:text-white/75 focus:border-white disabled:cursor-not-allowed disabled:opacity-70"
          />
          <p
            id="waitlist-email-error"
            className={`mt-2 min-h-5 text-sm leading-5 text-white ${emailError ? "block" : "hidden"}`}
          >
            {emailError}
          </p>
        </label>

        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold uppercase leading-4 tracking-[0.14em] text-white">
            City <span className="normal-case tracking-normal text-white/90">optional</span>
          </span>
          <input
            name="city"
            type="text"
            autoComplete="address-level2"
            enterKeyHint="done"
            maxLength={80}
            disabled={isSubmitting || isComplete}
            placeholder="Thessaloniki"
            className="form-control-scroll min-h-14 w-full min-w-0 rounded-2xl border border-white/30 bg-black/25 px-5 text-base leading-6 text-white transition-colors placeholder:text-white/75 focus:border-white disabled:cursor-not-allowed disabled:opacity-70"
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

      <label className="consent-row form-control-scroll mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/25 bg-black/15 p-4">
        <input
          ref={consentRef}
          name="consent"
          type="checkbox"
          required
          disabled={isSubmitting || isComplete}
          aria-invalid={Boolean(consentError)}
          aria-describedby={consentError ? "waitlist-consent-error" : undefined}
          className="mt-0.5 size-6 shrink-0 accent-black"
        />
        <span className="min-w-0 text-sm leading-6 text-white">
          I agree that NOXA may store my email and optional city and send
          early-access updates as described in the{" "}
          <a
            className="font-semibold underline decoration-white/60 underline-offset-4 hover:decoration-white"
            href="/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          . I have also read the{" "}
          <a
            className="font-semibold underline decoration-white/60 underline-offset-4 hover:decoration-white"
            href="/terms"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Use
          </a>
          . I can withdraw my consent at any time.
        </span>
      </label>
      <p
        id="waitlist-consent-error"
        className={`mt-2 min-h-5 text-sm leading-5 text-white ${consentError ? "block" : "hidden"}`}
      >
        {consentError}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting || isComplete}
          aria-busy={isSubmitting}
          className="inline-flex min-h-14 min-w-[132px] items-center justify-center rounded-full bg-white px-7 text-[17px] font-semibold leading-6 text-black transition-transform duration-[120ms] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-[.56] disabled:transform-none"
        >
          {isSubmitting
            ? "Joining…"
            : isComplete
              ? "Joined"
              : "Join NOXA"}
        </button>

        <p
          className="min-h-6 min-w-0 [overflow-wrap:anywhere] text-sm leading-6 text-white/90"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </form>
  );
}
