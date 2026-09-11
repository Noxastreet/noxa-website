"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  restoreRadarAdminSession,
  storeRadarAdminSession,
} from "@/lib/radarAdminSession";

type RangeKey = "1d" | "7d" | "30d" | "90d";
type CountData = { pageviews: number; visitors: number };
type BreakdownItem = { label: string; count: number; visitors: number };
type EventBreakdownItem = BreakdownItem & { path: string; city: string | null };
type AnalyticsData = {
  generatedAt: string;
  range: RangeKey;
  rangeSince: string;
  counts: {
    selected: CountData;
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
    topEventPages: EventBreakdownItem[];
  };
};

type LoadState = "loading" | "ready" | "signed_out" | "error" | "not_configured";

const rangeOptions: Array<[RangeKey, string]> = [
  ["1d", "Сегодня"],
  ["7d", "7 дней"],
  ["30d", "30 дней"],
  ["90d", "90 дней"],
];

const pageNames: Record<string, string> = {
  "/": "Главная",
  "/el": "Главная",
  "/meets": "Мероприятия",
  "/el/meets": "Мероприятия",
  "/map": "Карта",
  "/el/map": "Карта",
  "/communities": "Сообщества",
  "/el/communities": "Сообщества",
  "/organizers": "Организаторы",
  "/el/organizers": "Организаторы",
};

const deviceNames: Record<string, string> = {
  mobile: "Телефон",
  phone: "Телефон",
  desktop: "Компьютер",
  tablet: "Планшет",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/i.test(code)) return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0)));
}

function countryName(code: string) {
  try {
    const displayNames = new Intl.DisplayNames(["ru"], { type: "region" });
    return displayNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function friendlyReferrer(value: string) {
  const lower = value.trim().toLowerCase();
  if (!lower || lower === "direct" || lower === "(direct)" || lower === "unknown" || lower === "(none)") {
    return "Прямой переход";
  }
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("google")) return "Google";
  if (lower.includes("t.me") || lower.includes("telegram")) return "Telegram";
  if (lower.includes("facebook") || lower.includes("fb.com")) return "Facebook";
  if (lower.includes("noxastreetapp.com")) return "Внутренний переход";
  return "Другие сайты";
}

function friendlyPage(value: string) {
  if (pageNames[value]) return pageNames[value];
  if (/^\/(?:el\/)?meets\//.test(value)) return "Страница мероприятия";
  return value || "Главная";
}

function friendlyDevice(value: string) {
  return deviceNames[value.toLowerCase()] ?? value;
}

function friendlyOperatingSystem(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ipad") || lower === "ios") return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("mac") || lower.includes("os x")) return "macOS";
  if (lower.includes("linux")) return "Linux";
  return value;
}

function mergeBreakdown(items: BreakdownItem[], labelFor: (value: string) => string) {
  const merged = new Map<string, BreakdownItem>();
  for (const item of items) {
    const label = labelFor(item.label);
    const current = merged.get(label);
    merged.set(label, {
      label,
      count: (current?.count ?? 0) + item.count,
      visitors: (current?.visitors ?? 0) + item.visitors,
    });
  }
  return Array.from(merged.values()).sort((a, b) => b.count - a.count);
}

function SelectedMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0b0b0d] p-5 sm:p-6">
      <p className="text-sm font-medium text-white/55">{label}</p>
      <strong className="mt-3 block text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
        {formatNumber(value)}
      </strong>
    </article>
  );
}

function CompactMetric({ label, data }: { label: string; data: CountData }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="truncate text-[11px] text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{formatNumber(data.visitors)} посетителей</p>
    </div>
  );
}

function BreakdownList({
  title,
  items,
  labelFor,
  empty = "Пока недостаточно данных",
}: {
  title: string;
  items: BreakdownItem[];
  labelFor?: (value: string) => string;
  empty?: string;
}) {
  const normalizedItems = labelFor ? mergeBreakdown(items, labelFor) : items;
  const max = Math.max(1, ...normalizedItems.map((item) => item.count));
  const total = Math.max(1, normalizedItems.reduce((sum, item) => sum + item.count, 0));

  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0b0b0d] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-5 grid gap-4">
        {normalizedItems.length ? normalizedItems.map((item) => {
          const width = Math.max(3, Math.round((item.count / max) * 100));
          return (
            <div className="min-w-0" key={`${title}-${item.label}`}>
              <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-white/70" title={item.label}>{item.label}</span>
                <span className="shrink-0 font-semibold text-white">{formatNumber(item.count)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[#c8102e]" style={{ width: `${width}%` }} />
              </div>
              {title === "Страны" ? (
                <p className="mt-1.5 text-[11px] text-white/35">{Math.round((item.count / total) * 100)}%</p>
              ) : null}
            </div>
          );
        }) : <p className="text-sm text-white/40">{empty}</p>}
      </div>
    </section>
  );
}

function EventList({ items }: { items: EventBreakdownItem[] }) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0b0b0d] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Популярные мероприятия</h2>
      <div className="mt-5 grid gap-3">
        {items.length ? items.map((item) => (
          <div className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4" key={item.path}>
            <div className="min-w-0">
              <p className="break-words text-sm font-medium leading-5 text-white/85">{item.label}</p>
              {item.city ? <p className="mt-1 text-xs text-white/40">{item.city}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <strong className="block text-sm text-white">{formatNumber(item.count)}</strong>
              <span className="text-[10px] text-white/35">просмотров</span>
            </div>
          </div>
        )) : <p className="text-sm text-white/40">Пока недостаточно данных по мероприятиям</p>}
      </div>
    </section>
  );
}

export function FounderAnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");

      try {
        const session = await restoreRadarAdminSession();
        if (cancelled) return;
        if (!session) {
          setState("signed_out");
          return;
        }

        const response = await fetch(`/api/radar/admin/analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        });
        const payload = await response.json() as AnalyticsData & { error?: string; code?: string };
        if (cancelled) return;

        if (response.status === 401) {
          storeRadarAdminSession(null);
          setState("signed_out");
          return;
        }
        if (payload.code === "VERCEL_ANALYTICS_TOKEN_MISSING") {
          setState("not_configured");
          return;
        }
        if (!response.ok) {
          setState("error");
          return;
        }

        setData(payload);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [range]);

  const updated = data?.generatedAt
    ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))
    : "";

  if (state === "signed_out") {
    return (
      <main className="grid min-h-svh place-items-center bg-[#050505] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Сессия истекла</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Войдите снова через Radar Admin.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-black" href="/radar/admin">Перейти в Radar Admin →</Link>
        </section>
      </main>
    );
  }

  if (state === "not_configured") {
    return (
      <main className="grid min-h-svh place-items-center bg-[#050505] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Аналитика пока не настроена</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Статистика появится после подключения источника данных.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white" href="/radar/admin">← Radar Admin</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#050505] text-[#f5f5f7]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#050505]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em]">NOXA — Аналитика</h1>
            <p className="mt-1 hidden text-xs text-white/40 sm:block">Краткая статистика сайта noxastreetapp.com</p>
          </div>
          <Link className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/10 px-4 text-xs font-semibold text-white/70 hover:text-white" href="/radar/admin">← Radar Admin</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="text-sm text-white/45 sm:hidden">Краткая статистика сайта noxastreetapp.com</p>

        <div className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-0">
          {rangeOptions.map(([value, label]) => (
            <button
              aria-pressed={range === value}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${range === value ? "border-[#c8102e]/70 bg-[#c8102e]/15 text-white" : "border-white/10 bg-white/[0.025] text-white/50 hover:text-white"}`}
              key={value}
              onClick={() => setRange(value)}
              type="button"
            >{label}</button>
          ))}
        </div>

        {state === "error" ? (
          <div className="mt-6 rounded-2xl border border-[#e32c49]/25 bg-[#e32c49]/10 p-4 text-sm text-[#ffb1bd]">Не удалось загрузить статистику. Попробуйте обновить страницу позже.</div>
        ) : null}

        {state === "loading" ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((item) => <div className="h-36 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.025]" key={item} />)}
          </div>
        ) : null}

        {state === "ready" && data ? (
          <>
            <section className="mt-7 grid gap-3 sm:grid-cols-2" aria-label="Основные показатели">
              <SelectedMetric label="Посетители" value={data.counts.selected.visitors} />
              <SelectedMetric label="Просмотры страниц" value={data.counts.selected.pageviews} />
            </section>

            <section className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Краткая статистика">
              <CompactMetric data={data.counts.last24h} label="За 24 часа" />
              <CompactMetric data={data.counts.last7d} label="За 7 дней" />
              <CompactMetric data={data.counts.last30d} label="За 30 дней" />
              <CompactMetric data={data.counts.allTime} label="За всё время" />
            </section>

            <section className="mt-8 grid min-w-0 gap-3 lg:grid-cols-2">
              <BreakdownList
                items={data.breakdowns.countries}
                labelFor={(code) => `${countryFlag(code)} ${countryName(code)}`}
                title="Страны"
              />
              <BreakdownList items={data.breakdowns.referrers} labelFor={friendlyReferrer} title="Откуда приходят" />
              <BreakdownList items={data.breakdowns.topPages} labelFor={friendlyPage} title="Популярные страницы" />
              <EventList items={data.breakdowns.topEventPages} />
              <BreakdownList items={data.breakdowns.devices} labelFor={friendlyDevice} title="Устройства" />
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <BreakdownList items={data.breakdowns.browsers} title="Браузеры" />
                <BreakdownList items={data.breakdowns.operatingSystems} labelFor={friendlyOperatingSystem} title="Операционные системы" />
              </div>
            </section>

            <footer className="mt-8 border-t border-white/[0.07] pt-5 text-[11px] text-white/30">
              {updated ? <p>Обновлено: {updated}</p> : null}
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
