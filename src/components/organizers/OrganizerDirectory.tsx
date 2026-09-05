"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NoxaLogo } from "@/components/brand/NoxaLogo";
import type { PublicOrganizer } from "./organizer-data";
import styles from "./OrganizerPublic.module.css";

export function OrganizerDirectory({ organizers, locale }: { organizers: PublicOrganizer[]; locale: "en" | "el" }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US");
  const visible = useMemo(() => organizers.filter((organizer) => !normalized || [organizer.name, organizer.city ?? "", organizer.organizer_type].join(" ").toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US").includes(normalized)), [locale, normalized, organizers]);
  const base = locale === "el" ? "/el" : "";
  const t = locale === "el" ? { eyebrow: "NOXA ORGANIZERS", title: "Οι organizers πίσω από τα events.", body: "Βρες verified organizers και τα επόμενα events τους.", search: "Αναζήτηση organizer ή πόλης", count: "organizers", verified: "VERIFIED", view: "Προφίλ organizer" } : { eyebrow: "NOXA ORGANIZERS", title: "The organizers behind the events.", body: "Find verified organizers and their next events.", search: "Search organizer or city", count: "organizers", verified: "VERIFIED", view: "Organizer profile" };
  return <div className={styles.page}><header className={styles.header}><Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link><Link className={styles.back} href={`${base}/meets`}>← Meets</Link></header><main><section className={styles.hero}><div className={styles.shell}><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1><p className={styles.heroBody}>{t.body}</p><div className={styles.toolbar}><input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} /><span className={styles.count}>{visible.length} {t.count}</span></div></div></section><div className={`${styles.shell} ${styles.grid}`}>{visible.map((organizer) => <Link className={styles.card} href={`${base}/organizers/${organizer.slug}`} key={organizer.id}><div className={styles.badges}>{organizer.verified ? <span className={styles.badge}>{t.verified}</span> : null}{organizer.partner ? <span className={styles.partner}>{organizer.partner_label || "NOXA PARTNER"}</span> : null}</div><h2>{organizer.name}</h2><p className={styles.meta}>{[organizer.city, organizer.country_code].filter(Boolean).join(" · ")}</p><span className={styles.type}>{organizer.organizer_type}</span><strong className={styles.open}>{t.view} →</strong></Link>)}</div></main></div>;
}
