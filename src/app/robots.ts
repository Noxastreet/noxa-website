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
        "/organizers",
        "/organizers/",
        "/el/organizer",
        "/el/organizer/",
        "/el/organizers",
        "/el/organizers/",
      ],
    },
    sitemap: "https://noxastreetapp.com/sitemap.xml",
    host: "https://noxastreetapp.com",
  };
}
