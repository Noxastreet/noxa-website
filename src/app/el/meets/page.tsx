import type { Metadata } from "next";

import { MeetsDirectoryPage } from "@/components/meets/MeetsDirectoryPage";

export const metadata: Metadata = { title: "NOXA Meets — Car & moto events στην Ελλάδα", description: "Βρες δημόσια car meets, moto gatherings και automotive events στην Ελλάδα με το NOXA Meets.", alternates: { canonical: "https://noxastreetapp.com/el/meets", languages: { en: "https://noxastreetapp.com/meets", el: "https://noxastreetapp.com/el/meets" } } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function MeetsPage({ searchParams }: Props) { const params = await searchParams; return <MeetsDirectoryPage locale="el" initialFilters={{ country: first(params.country), city: first(params.city), type: first(params.type), date: first(params.date), q: first(params.q) }} />; }
