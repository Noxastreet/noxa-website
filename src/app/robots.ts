import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/organizer",
        "/organizer/",
        "/el/organizer",
        "/el/organizer/",
        "/organizers/*/claim",
        "/el/organizers/*/claim",
      ],
    },
    sitemap: "https://noxastreetapp.com/sitemap.xml",
    host: "https://noxastreetapp.com",
  };
}
