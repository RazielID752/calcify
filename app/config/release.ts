import packageJson from "@/package.json";
import releaseMetadata from "./release.json";

export const appRelease = {
  version: packageJson.version,
  channel:
    process.env.NEXT_PUBLIC_CALCIFY_RELEASE_CHANNEL ?? releaseMetadata.channel,
  publishedAt:
    process.env.NEXT_PUBLIC_CALCIFY_RELEASE_DATE ?? releaseMetadata.publishedAt,
  notesUrl:
    process.env.NEXT_PUBLIC_CALCIFY_RELEASE_NOTES_URL ??
    releaseMetadata.notesUrl,
};

export const appVersionLabel = `v${appRelease.version}`;

export const getFormattedReleaseDate = () =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${appRelease.publishedAt}T00:00:00`));
