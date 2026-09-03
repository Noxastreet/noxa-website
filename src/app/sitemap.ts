import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const futureAppPages = ["crews", "routes"];

  return [
    {
      url: "https://noxastreetapp.com",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://noxastreetapp.com/el",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://noxastreetapp.com/meets",
      lastModified,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: "https://noxastreetapp.com/el/meets",
      lastModified,
      changeFrequency: "daily",
      priority: 0.92,
    },
    {
      url: "https://noxastreetapp.com/meets/submit",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://noxastreetapp.com/el/meets/submit",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://noxastreetapp.com/communities",
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://noxastreetapp.com/el/communities",
      lastModified,
      changeFrequency: "daily",
      priority: 0.86,
    },
    {
      url: "https://noxastreetapp.com/communities/apply",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://noxastreetapp.com/el/communities/apply",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...futureAppPages.flatMap((feature) => [
      {
        url: `https://noxastreetapp.com/${feature}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.45,
      },
      {
        url: `https://noxastreetapp.com/el/${feature}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.42,
      },
    ]),
    {
      url: "https://noxastreetapp.com/privacy",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: "https://noxastreetapp.com/terms",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
