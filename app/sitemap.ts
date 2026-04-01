import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mpctools.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), priority: 1 },
    { url: `${siteUrl}/prep`, lastModified: new Date(), priority: 0.8 },
    { url: `${siteUrl}/outpaint`, lastModified: new Date(), priority: 0.8 },
    { url: `${siteUrl}/merger`, lastModified: new Date(), priority: 0.8 },
  ];
}
