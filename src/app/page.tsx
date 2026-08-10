import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n/site-copy";

export default function Home() {
  redirect(`/${defaultLocale}`);
}
