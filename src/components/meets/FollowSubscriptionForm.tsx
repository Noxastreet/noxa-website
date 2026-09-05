"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import styles from "./FollowSubscriptionForm.module.css";

type Target =
  | { type: "city"; city: string; countryCode: string }
  | { type: "organizer"; organizerId: string };
type Props = { locale: "en" | "el"; target: Target; title: string; compact?: boolean };
type State = "idle" | "submitting" | "success" | "error";

export function FollowSubscriptionForm({ locale, target, title, compact = false }: Props) {
  const startedAt = useRef<number | null>(null);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const t = locale === "el" ? {
    email: "Email",
    consent: "Συμφωνώ να αποθηκευτεί το email μου για updates σχετικά με αυτό το θέμα.",
    submit: "Ακολούθησε",
    submitting: "Αποθήκευση…",
    success: "Η εγγραφή αποθηκεύτηκε. Θα λαμβάνεις NOXA updates όταν η αποστολή ενεργοποιηθεί.",
    error: "Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.",
  } : {
    email: "Email",
    consent: "I agree that my email can be stored for updates about this topic.",
    submit: "Follow",
    submitting: "Saving…",
    success: "Subscription saved. You’ll receive NOXA updates when delivery is enabled.",
    error: "Could not save the subscription. Try again.",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "");
    const consent = form.get("consent") === "on";
    const website = String(form.get("website") ?? "");
    setState("submitting");
    setMessage("");

    const common = {
      email,
      consent,
      website,
      locale,
      startedAt: startedAt.current,
    };
    const payload = target.type === "city"
      ? { ...common, targetType: "city", city: target.city, countryCode: target.countryCode }
      : { ...common, targetType: "organizer", organizerId: target.organizerId };

    try {
      const response = await fetch("/api/meets/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || t.error);
      setState("success");
      setMessage(t.success);
      formElement.reset();
      startedAt.current = Date.now();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : t.error);
    }
  }

  return (
    <form className={`${styles.form} ${compact ? styles.compact : ""}`} onSubmit={submit}>
      <div>
        <p className={styles.title}>{title}</p>
        <p className={styles.note}>{locale === "el" ? "Αποθηκεύουμε μόνο τη συνδρομή. Δεν υποσχόμαστε email delivery πριν ενεργοποιηθεί." : "We only save the subscription for now. Email delivery is not promised until it is enabled."}</p>
      </div>
      <label className={styles.field}><span>{t.email}</span><input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label className={styles.consent}><input name="consent" type="checkbox" required /><span>{t.consent}</span></label>
      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? t.submitting : t.submit}</button>
      {message ? <p className={state === "error" ? styles.error : styles.status} role="status">{message}</p> : null}
    </form>
  );
}
