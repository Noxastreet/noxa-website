export type RadarEvent = {
  id: string;
  countryCode: string;
  title: string;
  category: string;
  dateLabel: string;
  dateDetail: string;
  location: string;
  city: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
};

export const radarEvents: RadarEvent[] = [
  {
    id: "gs-motodays-serres-2026",
    countryCode: "GR",
    title: "GS MOTODAYS",
    category: "MOTO · TRACK",
    dateLabel: "05–06 SEP",
    dateDetail: "5–6 September 2026",
    location: "Serres Racing Circuit",
    city: "Serres",
    description: "Two-day motorcycle track event at Serres Racing Circuit.",
    sourceName: "Serres Circuit",
    sourceUrl: "https://serrescircuit.gr/en/the-event/gs-motodays/",
  },
  {
    id: "open-track-day-serres-2026-09-07",
    countryCode: "GR",
    title: "Open Track Day / Free Training",
    category: "TRACK DAY",
    dateLabel: "07 SEP",
    dateDetail: "7 September 2026 · 09:00–18:45",
    location: "Serres Racing Circuit",
    city: "Serres",
    description: "Public open track day and free-training session at the Serres circuit.",
    sourceName: "Serres Circuit",
    sourceUrl: "https://serrescircuit.gr/en/the-event/open-track-day-eleftheri-proponisi-49/",
  },
  {
    id: "greek-dragster-championship-lenoe-2026",
    countryCode: "GR",
    title: "Greek Dragster Championship by LENOE",
    category: "DRAG RACING",
    dateLabel: "18–20 SEP",
    dateDetail: "18–20 September 2026",
    location: "Serres Racing Circuit",
    city: "Serres",
    description: "Three-day Greek drag racing championship weekend listed by Serres Circuit.",
    sourceName: "Serres Circuit",
    sourceUrl: "https://serrescircuit.gr/en/the-event/greek-dragster-championship-by-lenoe/",
  },
];
