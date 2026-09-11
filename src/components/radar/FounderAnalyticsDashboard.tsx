"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  clearRadarAdminReturnIntent,
  RADAR_ADMIN_ANALYTICS_PATH,
  rememberRadarAdminReturnIntent,
  resolveRadarAdminSession,
} from "@/lib/radarAdminSession";

type RangeKey = "1d" | "7d" | "30d" | "90d";
type CountData = { pageviews: number; visitors: number };
type BreakdownItem = {
  label: string;
  count: number;
  visitors: number;
  path?: string;
  title?: string;
  city?: string | null;
};
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
    topEventPages: BreakdownItem[];
  };
  warnings: string[];
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
  "/radar": "Мероприятия",
  "/map": "Карта",
  "/el/map": "Карта",
  "/communities": "Сообщества",
  "/el/communities": "Сообщества",
  "/organizers": "Организаторы",
  "/el/organizers": "Организаторы",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function friendlyCountry(code: string) {
  return `${countryFlag(code)} ${countryName(code)}`;
}

function friendlyDevice(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("mobile") || normalized.includes("phone")) return "Телефон";
  if (normalized.includes("desktop")) return "Компьютер";
  if (normalized.includes("tablet")) return "Планшет";
  return "Другое";
}

function friendlyOperatingSystem(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("ios") || normalized.includes("iphone") || normalized.includes("ipad")) return "iOS";
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("windows")) return "Windows";
  if (normalized.includes("mac") || normalized.includes("os x")) return "macOS";
  if (normalized.includes("linux")) return "Linux";
  return value || "Другое";
}

function friendlyPage(item: BreakdownItem) {
  if (item.title?.trim()) return item.title.trim();
  const rawPath = (item.path ?? item.label).split("?")[0].replace(/\/$/, "") || "/";
  if (pageNames[rawPath]) return pageNames[rawPath];
  if (/^\/(?:el\/)?meets\//.test(rawPath)) return "Страница мероприятия";
  return rawPath.length > 42 ? `${rawPath.slice(0, 39)}…` : rawPath;
}

function percent(value: number, total: number) {
  if (!total || value <= 0) return "0%";
  const result = Math.round((value / total) * 100);
  return `${Math.min(100, Math.max(1, result))}%`;
}

function PrimaryMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0b0b0d] p-5 sm:p-6">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <strong className="mt-3 block text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">{formatNumber(value)}</strong>
      <p className="mt-3 text-[11px] text-white/35">{note}</p>
    </article>
  );
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <p className="truncate text-[10px] text-white/40">{label}</p>
      <strong className="mt-1 block text-lg font-semibold text-white/90">{formatNumber(value)}</strong>
    </div>
  );
}

function RankedList({
  title,
  items,
  total,
  label,
  showPercent = false,
}: {
  title: string;
  items: BreakdownItem[];
  total: number;
  label: (item: BreakdownItem) => string;
  showPercent?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b0b0d] p-5">
      <h2 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h2>
      <div className="mt-4 grid gap-1">
        {items.length ? items.map((item, index) => (
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.055] py-3 last:border-b-0" key={`${title}-${item.label}-${index}`}>
            <span className="min-w-0 break-words text-sm text-white/70">{label(item)}</span>
            <span className="shrink-0 text-right text-xs font-semibold text-white/85">
              {showPercent ? percent(item.count, total) : formatNumber(item.count)}
            </span>
          </div>
        )) : <p className="py-4 text-sm text-white/40">Пока недостаточно данных</p>}
      </div>
    </section>
  );
}

function EventList({ items }: { items: BreakdownItem[] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b0b0d] p-5">
      <h2 className="text-base font-semibold tracking-[-0.02em] text-white">Популярные мероприятия</h2>
      <div className="mt-4 grid gap-1">
        {items.length ? items.map((item, index) => (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.055] py-3 last:border-b-0" key={`${item.path ?? item.label}-${index}`}>
            <div className="min-w-0">
              <strong className="block break-words text-sm font-medium leading-5 text-white/80">{friendlyPage(item)}</strong>
              <span className="mt-1 block truncate text-[11px] text-white/35">{item.city?.trim() || "Греция"}</span>
            </div>
            <div className="text-right">
              <strong className="block text-sm font-semibold text-white">{formatNumber(item.count)}</strong>
              <span className="text-[10px] text-white/35">просмотров</span>
            </div>
          </div>
        )) : <p className="py-4 text-sm text-white/40">Пока недостаточно данных о просмотрах мероприятий</p>}
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
    const controller = new AbortController();

    async function request(accessToken: string) {
      return fetch(`/api/radar/admin/analytics?range=${range}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: controller.signal,
      });
    }

    async function load() {
      setState("loading");

      try {
        let sessionResult = await resolveRadarAdminSession({ verifyAdmin: false });
        if (cancelled) return;
        if (sessionResult.status !== "authorized") {
          rememberRadarAdminReturnIntent(RADAR_ADMIN_ANALYTICS_PATH);
          setState("signed_out");
          return;
        }

        let response = await request(sessionResult.session.accessToken);
        if (response.status === 401) {
          sessionResult = await resolveRadarAdminSession({
            forceRefresh: true,
            verifyAdmin: true,
          });
          if (cancelled) return;
          if (sessionResult.status !== "authorized") {
            rememberRadarAdminReturnIntent(RADAR_ADMIN_ANALYTICS_PATH);
            setState("signed_out");
            return;
          }
          response = await request(sessionResult.session.accessToken);
        }

        const payload = await response.json() as AnalyticsData & { error?: string; code?: string };
        if (cancelled) return;

        if (response.status === 401) {
          rememberRadarAdminReturnIntent(RADAR_ADMIN_ANALYTICS_PATH);
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

        clearRadarAdminReturnIntent();
        setData(payload);
        setState("ready");
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setState("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range]);

  const periodLabel = rangeOptions.find(([value]) => value === range)?.[1] ?? "выбранный период";
  const updated = data?.generatedAt
    ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))
    : "";

  if (state === "signed_out") {
    return (
      <main className="grid min-h-svh place-items-center overflow-x-hidden bg-[#050505] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA — Аналитика</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Сессия истекла</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Войдите снова через Radar Admin. Если refresh-сессия ещё действительна, повторный magic-link не потребуется.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-black" href="/radar/admin">← Radar Admin</Link>
        </section>
      </main>
    );
  }

  if (state === "not_configured") {
    return (
      <main className="grid min-h-svh place-items-center overflow-x-hidden bg-[#050505] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0d] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">NOXA — Аналитика</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Аналитика пока не настроена</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Серверная настройка Vercel Analytics ещё недоступна для этой страницы.</p>
          <Link className="mt-6 inline-flex min-h-12 items-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white" href="/radar/admin">← Radar Admin</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#050505] text-[#f5f5f7]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#050505]/92 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em]">NOXA — Аналитика</h1>
            <p className="mt-1 truncate text-[11px] text-white/40">Краткая статистика сайта noxastreetapp.com</p>
          </div>
          <Link className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/10 px-4 text-xs font-semibold text-white/70 hover:text-white" href="/radar/admin">← Radar Admin</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section aria-label="Период аналитики">
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
            {rangeOptions.map(([value, label]) => (
              <button
                aria-pressed={range === value}
                className={`min-h-11 min-w-0 rounded-xl px-2 text-[11px] font-semibold transition sm:text-xs ${range === value ? "bg-[#c8102e] text-white" : "text-white/45 hover:text-white"}`}
                key={value}
                onClick={() => setRange(value)}
                type="button"
              >{label}</button>
            ))}
          </div>
        </section>

        {state === "error" ? (
          <div className="mt-6 rounded-2xl border border-[#e32c49]/25 bg-[#e32c49]/10 p-4 text-sm text-[#ff9aaa]">Не удалось загрузить аналитику. Попробуйте обновить страницу.</div>
        ) : null}

        {state === "loading" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((item) => <div className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" key={item} />)}
          </div>
        ) : null}

        {state === "ready" && data ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Основные показатели">
              <PrimaryMetric label="Посетители" note={`За период: ${periodLabel}`} value={data.counts.selected.visitors} />
              <PrimaryMetric label="Просмотры страниц" note={`За период: ${periodLabel}`} value={data.counts.selected.pageviews} />
            </section>

            <section className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Посетители по периодам">
              <CompactMetric label="Посетители за 24 часа" value={data.counts.last24h.visitors} />
              <CompactMetric label="За 7 дней" value={data.counts.last7d.visitors} />
              <CompactMetric label="За 30 дней" value={data.counts.last30d.visitors} />
              <CompactMetric label="За всё время" value={data.counts.allTime.visitors} />
            </section>

            <section className="mt-7 grid min-w-0 gap-3 lg:grid-cols-2">
              <RankedList
                items={data.breakdowns.countries}
                label={(item) => friendlyCountry(item.label)}
                showPercent
                title="Страны"
                total={data.counts.selected.pageviews}
              />
              <RankedList
                items={data.breakdowns.referrers}
                label={(item) => item.label || "Прямой переход"}
                showPercent
                title="Откуда приходят"
                total={data.counts.selected.pageviews}
              />
              <RankedList
                items={data.breakdowns.topPages}
                label={friendlyPage}
                title="Популярные страницы"
                total={data.counts.selected.pageviews}
              />
              <EventList items={data.breakdowns.topEventPages} />
              <RankedList
                items={data.breakdowns.devices}
                label={(item) => friendlyDevice(item.label)}
                title="Устройства"
                total={data.counts.selected.pageviews}
              />
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <RankedList
                  items={data.breakdowns.browsers.slice(0, 6)}
                  label={(item) => item.label || "Другое"}
                  title="Браузеры"
                  total={data.counts.selected.pageviews}
                />
                <RankedList
                  items={data.breakdowns.operatingSystems.slice(0, 6)}
                  label={(item) => friendlyOperatingSystem(item.label)}
                  title="Операционные системы"
                  total={data.counts.selected.pageviews}
                />
              </div>
            </section>

            <footer className="mt-7 border-t border-white/[0.07] pt-5 text-[11px] leading-5 text-white/30">
              <p>Обновлено: {updated}. «За всё время» — с момента подключения Vercel Analytics.</p>
              {data.warnings.length ? <p className="mt-1">Часть статистики временно недоступна.</p> : null}
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
