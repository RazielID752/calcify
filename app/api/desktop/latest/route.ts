import { NextResponse } from "next/server";
import { appRelease } from "@/app/config/release";

export const dynamic = "force-static";

const DEFAULT_MAC_DOWNLOAD_URL =
  "https://calcify.app/downloads/calcify-macos.dmg";
const DEFAULT_WINDOWS_DOWNLOAD_URL =
  "https://calcify.app/downloads/calcify-windows.exe";

export async function GET() {
  return NextResponse.json({
    latestVersion:
      process.env.CALCIFY_DESKTOP_LATEST_VERSION ?? appRelease.version,
    downloads: {
      darwin: process.env.CALCIFY_MAC_DOWNLOAD_URL ?? DEFAULT_MAC_DOWNLOAD_URL,
      win32:
        process.env.CALCIFY_WINDOWS_DOWNLOAD_URL ??
        DEFAULT_WINDOWS_DOWNLOAD_URL,
    },
    releaseChannel: appRelease.channel,
    releaseDate: appRelease.publishedAt,
    releaseNotesUrl:
      process.env.CALCIFY_RELEASE_NOTES_URL ?? appRelease.notesUrl,
  });
}
