import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://noxastreetapp.com/el",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          el: "https://noxastreetapp.com/el",
          en: "https://noxastreetapp.com/en",
          ru: "https://noxastreetapp.com/ru",
        },
      },
    },
    {
      url: "https://noxastreetapp.com/en",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          el: "https://noxastreetapp.com/el",
          en: "https://noxastreetapp.com/en",
          ru: "https://noxastreetapp.com/ru",
        },
      },
    },
    {
      url: "https://noxastreetapp.com/ru",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          el: "https://noxastreetapp.com/el",
          en: "https://noxastreetapp.com/en",
          ru: "https://noxastreetapp.com/ru",
        },
      },
    },
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
