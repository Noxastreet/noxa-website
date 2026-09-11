"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SESSION_KEY = "noxa-radar-admin-session-v1";

type RangeKey = "1d" | "7d" | "30d" | "90d";
type CountData = { pageviews: number; visitors: number };
type BreakdownItem = { label: string; count: number; visitors: number };
type AnalyticsData = {
  generatedAt: string;
  range: RangeKey;
  rangeSince: string;
  counts: {
    last24h: CountData;
    last7d: CountData;
    last30d: CountData;
    allTime: CountData;
  };
  breakdowns: {
    countries: BreakdownItem[];
    referrers: BreakdownItem[];
    devices: BreakdownItem[];
    browsers: BreakdownItem[];
    operatingSystems: BreakdownItem[];
    topPages: BreakdownItem[];
    topEventPages: BreakdownItem[];
  };
  warnings: string[];
};

type StoredSession = {
  accessToken?: string;
  expiresAt?: number;
};

type LoadState = "loading" | "ready" | "signed_out" | "error" | "not_configured";

const rangeOptions: Array<[RangeKey, string]> = [
  ["1d", "24h"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
];

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as StoredSession : null;
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

function friendlyLabel(value: string, kind?: "country" | "path") {
  if (kind === "country") return `${countryFlag(value)} ${value}`;
  if (kind === "path" && value === "/") return "Homepage";
  return value;
}

function MetricCard({ label, data, note }: { label: string; data: CountData; note: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <strong className="block text-3xl font-semibold tracking-[-0.04em] text-white">{formatNumber(data.visitors)}</strong>
          <span className="mt-1 block text-xs text-white/45">visitors</span>
        </div>
        <div className="text-right">
          <strong className="block text-lg font-semibold text-white/85">{formatNumber(data.pageviews)}</strong>
          <span className="block text-xs text-white/40">views</span>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-white/35">{note}</p>
    </article>
  );
}

function BreakdownList({
  title,
  items,
  kind,
  empty = "No data yet.",
}: {
  title: string;
  items: BreakdownItem[];
  kind?: "country" | "path";
  empty?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">pageviews</span>
      </div>
      <div className="mt-5 grid gap-4">
        {items.length ? items.map((item) => {
          const width = Math.max(3, Math.round((item.count / max) * 100));
          return (
            <div key={`${title}-${item.label}`}>
              <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-white/70" title={item.label}>{friendlyLabel(item.label, kind)}</span>
                <span className="shrink-0 font-semibold text-white">{formatNumber(item.count)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[#c8102e]" style={{ width: `${width}%` }} />
              </div>
              {item.visitors > 0 ? <p className="mt-1.5 text-[10px] text-white/30">{formatNumber(item.visitors)} visitors</p> : null}
            </div>
          );
        }) : <p className="text-xs text-white/40">{empty}</p>}
      </div>
    </section>
  );
}

export function FounderAnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setError("");

      const session = readSession();
      if (!session?.accessToken || (session.expiresAt && session.expiresAt <= Date.now())) {
        if (!cancelled) setState("signed_out");
        return;
      }

      try {
        const response = await fetch(`/api/radar/admin/analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        });
        const payload = await response.json() as AnalyticsData & { error?: string; detail?: string; code?: string };

        if (cancelled) return;
        if (response.status === 401) {
          setState("signed_out");
          return;
        }
        if (payload.code === "VERCEL_ANALYTICS_TOKEN_MISSING") {
          setState("not_configured");
          return;
        }
        if (!response.ok) {
          throw new Error(payload.detail ?? payload.error ?? "Unable to load analytics.");
        }

        setData(payload);
        setState("ready");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
          setState("error");
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [range]);

  const updated = data?.generatedAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))
    : "";

  if (state === "signed_out") {
    return (
      <main className="grid min-h-svh place-items-center bg-[#050505] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA Founder</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Private analytics</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Open Radar Admin and sign in with the owner account first.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-black" href="/radar/admin">Open Radar Admin →</Link>
        </section>
      </main>
    );
  }

  if (state === "not_configured") {
    return (
      <main className="grid min-h-svh place-items-center bg-[#050505] px-5 text-white">
        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA Founder</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">One variable required</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Add a server-only Vercel environment variable named <code className="rounded bg-white/[0.06] px-1.5 py-1 text-white">VERCEL_ANALYTICS_TOKEN</code>. The token is never exposed to the browser.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white" href="/radar/admin">← Radar Admin</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-svh bg-[#050505] text-[#f5f5f7]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#050505]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA · Founder</p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Overview</h1>
          </div>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 text-xs font-semibold text-white/70 hover:text-white" href="/radar/admin">Radar Admin</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">Website Analytics</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Know what is moving.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Traffic, acquisition and the pages people actually use on noxastreetapp.com.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rangeOptions.map(([value, label]) => (
              <button
                aria-pressed={range === value}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${range === value ? "border-[#c8102e]/70 bg-[#c8102e]/15 text-white" : "border-white/10 bg-white/[0.025] text-white/45 hover:text-white"}`}
                key={value}
                onClick={() => setRange(value)}
                type="button"
              >{label}</button>
            ))}
          </div>
        </div>

        {state === "error" ? (
          <div className="mt-6 rounded-2xl border border-[#e32c49]/25 bg-[#e32c49]/10 p-4 text-sm text-[#ff9aaa]">{error}</div>
        ) : null}

        {state === "loading" ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" key={item} />)}
          </div>
        ) : null}

        {state === "ready" && data ? (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Traffic summary">
              <MetricCard data={data.counts.last24h} label="Last 24 hours" note="Rolling 24-hour window" />
              <MetricCard data={data.counts.last7d} label="Last 7 days" note="Unique visitors and page views" />
              <MetricCard data={data.counts.last30d} label="Last 30 days" note="Useful monthly baseline" />
              <MetricCard data={data.counts.allTime} label="Since analytics enabled" note="Not historical before Vercel Analytics" />
            </section>

            <section className="mt-8 grid gap-3 lg:grid-cols-2">
              <BreakdownList items={data.breakdowns.countries} kind="country" title="Countries" />
              <BreakdownList items={data.breakdowns.referrers} title="Traffic sources" />
              <BreakdownList items={data.breakdowns.topPages} kind="path" title="Top pages" />
              <BreakdownList items={data.breakdowns.topEventPages} kind="path" title="Top event pages" empty="No event detail traffic in this period yet." />
              <BreakdownList items={data.breakdowns.devices} title="Devices" />
              <BreakdownList items={data.breakdowns.browsers} title="Browsers" />
              <BreakdownList items={data.breakdowns.operatingSystems} title="Operating systems" />
            </section>

            <footer className="mt-8 border-t border-white/[0.07] pt-5 text-[11px] leading-5 text-white/30">
              <p>Updated {updated}. Breakdown window: {rangeOptions.find(([value]) => value === data.range)?.[1] ?? data.range}.</p>
              {data.warnings.length ? <p className="mt-1">Provider warnings: {data.warnings.join(" · ")}</p> : null}
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
