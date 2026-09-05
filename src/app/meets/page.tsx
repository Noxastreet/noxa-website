import type { Metadata } from "next";

import { MeetsDirectoryPage } from "@/components/meets/MeetsDirectoryPage";

export const metadata: Metadata = { title: "NOXA Meets — Car & moto events across Greece", description: "Find public car meets, moto gatherings and automotive events across Greece with NOXA Meets.", alternates: { canonical: "https://noxastreetapp.com/meets", languages: { en: "https://noxastreetapp.com/meets", el: "https://noxastreetapp.com/el/meets" } } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function MeetsPage({ searchParams }: Props) { const params = await searchParams; return <MeetsDirectoryPage locale="en" initialFilters={{ country: first(params.country), city: first(params.city), type: first(params.type), date: first(params.date), q: first(params.q) }} />; }
