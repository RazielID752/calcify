import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.calcify.com.br/" },
    { url: "https://www.calcify.com.br/privacidade" },
  ];
}
