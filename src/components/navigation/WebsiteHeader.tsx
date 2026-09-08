import { SiteHeader } from "./SiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

type Props = { locale: Locale; path?: string; action?: "app" | "submit" };

export function WebsiteHeader({ locale, path = "", action = "app" }: Props) {
  const base = locale === "el" ? "/el" : "";
  const copy = landingCopy[locale];
  return <SiteHeader
    locale={locale}
    homeHref={base || "/"}
    currentPath={path.startsWith("/meets") ? `${base}/meets` : undefined}
    joinHref={action === "submit" ? `${base}/meets/submit` : `${base || "/"}#app`}
    languagePaths={{ en: path || "/", el: `/el${path}` }}
    languageCopy={copy.language}
    navigationCopy={{ ...copy.navigation,
      join: action === "submit" ? (locale === "el" ? "Πρόσθεσε Event" : "Add Event") : "NOXA App",
      items: [["Meets", `${base}/meets`], [locale === "el" ? "Κοινότητες" : "Communities", `${base}/communities`]],
    }}
  />;
}
