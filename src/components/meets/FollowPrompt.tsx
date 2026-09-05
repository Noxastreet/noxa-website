"use client";

import { FormEvent, useState } from "react";

import styles from "./FollowPrompt.module.css";

type Props = {
  targetType: "city" | "organizer";
  targetKey: string;
  targetLabel: string;
  locale: "en" | "el";
  compact?: boolean;
};

export function FollowPrompt({ targetType, targetKey, targetLabel, locale, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const t = locale === "el" ? {
    city: `Ειδοποίησέ με για ${targetLabel}`,
    organizer: `Ακολούθησε ${targetLabel}`,
    hint: "Θα σου στείλουμε email όταν εμφανιστούν νέα σχετικά events.",
    email: "Email",
    consent: "Συμφωνώ να λαμβάνω NOXA event alerts για αυτή την επιλογή.",
    submit: "Ενεργοποίηση",
    sending: "Αποθήκευση…",
    sent: "Έτοιμο. Η ειδοποίηση ενεργοποιήθηκε.",
    error: "Δεν αποθηκεύτηκε. Δοκίμασε ξανά.",
  } : {
    city: `Notify me about ${targetLabel}`,
    organizer: `Follow ${targetLabel}`,
    hint: "NOXA will email you when new matching events appear.",
    email: "Email",
    consent: "I agree to receive NOXA event alerts for this selection.",
    submit: "Turn on alerts",
    sending: "Saving…",
    sent: "Done. Your alert is active.",
    error: "Could not save. Try again.",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/meets/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          consent: form.get("consent") === "on",
          targetType,
          targetKey,
          targetLabel,
          locale,
        }),
      });
      if (!response.ok) throw new Error("follow failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <div className={`${styles.success} ${compact ? styles.compact : ""}`}>{t.sent}</div>;

  return <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
    <button className={styles.openButton} type="button" onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">＋</span>{targetType === "city" ? t.city : t.organizer}
    </button>
    {open ? <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <p>{t.hint}</p>
      <label><span>{t.email}</span><input name="email" type="email" required autoComplete="email" /></label>
      <label className={styles.consent}><input name="consent" type="checkbox" required /><span>{t.consent}</span></label>
      <button type="submit" disabled={state === "sending"}>{state === "sending" ? t.sending : t.submit}</button>
      {state === "error" ? <small>{t.error}</small> : null}
    </form> : null}
  </div>;
}
