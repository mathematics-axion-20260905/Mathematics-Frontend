import type { MetadataRoute } from "next";

const SITE_URL = "https://math.dirac.space";
const moduleSlugs = ["integral-studio", "differential-studio", "matrix-studio", "probability-studio", "series-limit-studio"];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return [
        { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/laboratory`, lastModified, changeFrequency: "weekly", priority: 0.95 },
        ...moduleSlugs.map((slug) => ({
            url: `${SITE_URL}/laboratory/${slug}`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        })),
    ];
}
