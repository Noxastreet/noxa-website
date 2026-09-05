"use client";

import { FormEvent, useState } from "react";
import styles from "./FollowPrompt.module.css";

type Props = { targetType: "city" | "organizer"; targetKey: string; targetLabel: string; locale: "en" | "el"; compact?: boolean };

export function FollowPrompt({ targetType, targetKey, targetLabel, locale, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const t = locale === "el" ? {
    city: `Αποθήκευσε alert για ${targetLabel}`,
    organizer: `Ακολούθησε ${targetLabel}`,
    hint: "Αποθήκευσε την επιλογή σου και λάβε confirmation email. Τα αυτόματα matching-event alerts ενεργοποιούνται σταδιακά.",
    email: "Email", consent: "Συμφωνώ να αποθηκευτεί αυτή η επιλογή για NOXA event alerts.", submit: "Αποθήκευση alert", sending: "Αποθήκευση…", sent: "Έτοιμο. Η προτίμηση alert αποθηκεύτηκε.", error: "Δεν αποθηκεύτηκε. Δοκίμασε ξανά.",
  } : {
    city: `Save alert for ${targetLabel}`,
    organizer: `Follow ${targetLabel}`,
    hint: "Save this preference and receive a confirmation email. Automated matching-event alerts are being rolled out progressively.",
    email: "Email", consent: "I agree to save this preference for NOXA event alerts.", submit: "Save alert", sending: "Saving…", sent: "Saved. Your NOXA alert preference is recorded.", error: "Could not save. Try again.",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending"); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/meets/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), consent: form.get("consent") === "on", targetType, targetKey, targetLabel, locale }) });
      if (!response.ok) throw new Error("follow failed"); setState("sent");
    } catch { setState("error"); }
  }

  if (state === "sent") return <div className={`${styles.success} ${compact ? styles.compact : ""}`}>{t.sent}</div>;
  return <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
    <button className={styles.openButton} type="button" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">＋</span>{targetType === "city" ? t.city : t.organizer}</button>
    {open ? <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <p>{t.hint}</p><label><span>{t.email}</span><input name="email" type="email" required autoComplete="email" /></label>
      <label className={styles.consent}><input name="consent" type="checkbox" required /><span>{t.consent}</span></label>
      <button type="submit" disabled={state === "sending"}>{state === "sending" ? t.sending : t.submit}</button>{state === "error" ? <small>{t.error}</small> : null}
    </form> : null}
  </div>;
}
