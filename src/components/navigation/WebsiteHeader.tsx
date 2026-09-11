import { SiteHeader } from "./SiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

type Props = { locale: Locale; path?: string; action?: "app" | "submit" };

export function WebsiteHeader({ locale, path = "" }: Props) {
  const base = locale === "el" ? "/el" : "";
  const copy = landingCopy[locale];
  const activeRoot = ["/meets", "/map"].find(
    (root) => path === root || path.startsWith(`${root}/`),
  );

  return <SiteHeader
    locale={locale}
    homeHref={base || "/"}
    currentPath={activeRoot ? `${base}${activeRoot}` : undefined}
    joinHref={`${base}/meets/submit`}
    languagePaths={{ en: path || "/", el: `/el${path}` }}
    languageCopy={copy.language}
    navigationCopy={{ ...copy.navigation,
      join: locale === "el" ? "Πρόσθεσε Event" : "Add Event",
      items: [
        ["Meets", `${base}/meets`],
        ["Map", `${base}/map`],
      ],
    }}
  />;
}
