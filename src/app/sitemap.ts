import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const featurePages = ["meets", "crews", "routes"];

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
      url: "https://noxastreetapp.com/radar",
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://noxastreetapp.com/radar/submit",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.68,
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
    ...featurePages.flatMap((feature) => [
      {
        url: `https://noxastreetapp.com/${feature}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.82,
      },
      {
        url: `https://noxastreetapp.com/el/${feature}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.78,
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
