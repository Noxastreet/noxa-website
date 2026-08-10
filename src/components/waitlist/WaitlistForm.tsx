"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  siteCopy,
  type Locale,
  type WaitlistCopy,
} from "@/i18n/site-copy";

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

type WaitlistFormProps = {
  locale?: Locale;
  copy?: WaitlistCopy;
};

export function WaitlistForm({
  locale = "en",
  copy = siteCopy.en.waitlist,
}: WaitlistFormProps = {}) {
  const startedAt = useRef(0);
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "submitting") return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const searchParams = new URLSearchParams(window.location.search);

    setState("submitting");
    setMessage(copy.joining);

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
          locale,
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
        setMessage(copy.alreadyJoined);
      } else {
        setState("success");
        setMessage(copy.success);
      }

      form.reset();
    } catch (error) {
      const code = error instanceof Error ? error.message : "submission_failed";

      setState("error");
      setMessage(copy.errors[code] ?? copy.errors.submission_failed);
      startedAt.current = Date.now();
    }
  }

  const isSubmitting = state === "submitting";
  const isComplete = state === "success" || state === "already-joined";

  return (
    <form className="waitlistForm" onSubmit={handleSubmit} noValidate>
      <div className="waitlistFields">
        <label>
          <span>{copy.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isSubmitting || isComplete}
            placeholder={copy.emailPlaceholder}
          />
        </label>

        <label>
          <span>
            {copy.city} <small>{copy.optional}</small>
          </span>
          <input
            name="city"
            type="text"
            autoComplete="address-level2"
            maxLength={80}
            disabled={isSubmitting || isComplete}
            placeholder={copy.cityPlaceholder}
          />
        </label>
      </div>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="consentRow">
        <input
          name="consent"
          type="checkbox"
          required
          disabled={isSubmitting || isComplete}
        />
        <span>
          {copy.consentBeforePrivacy}
          <Link href="/privacy" target="_blank" rel="noreferrer">
            {copy.privacy}
          </Link>
          {copy.consentBetween}
          <Link href="/terms" target="_blank" rel="noreferrer">
            {copy.terms}
          </Link>
          {copy.consentAfterTerms}
        </span>
      </label>

      <button type="submit" disabled={isSubmitting || isComplete}>
        <span>
          {isSubmitting
            ? copy.submitting
            : isComplete
              ? copy.joined
              : copy.submit}
        </span>
        <span aria-hidden="true">↗</span>
      </button>

      <p
        className={`formNote ${state === "error" ? "formError" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message || copy.note}
      </p>
    </form>
  );
}
