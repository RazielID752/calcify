import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export const dynamic = "force-static";

const DEFAULT_MAC_DOWNLOAD_URL =
  "https://calcify.app/downloads/calcify-macos.dmg";
const DEFAULT_WINDOWS_DOWNLOAD_URL =
  "https://calcify.app/downloads/calcify-windows.exe";

export async function GET() {
  return NextResponse.json({
    latestVersion:
      process.env.CALCIFY_DESKTOP_LATEST_VERSION ?? packageJson.version,
    downloads: {
      darwin: process.env.CALCIFY_MAC_DOWNLOAD_URL ?? DEFAULT_MAC_DOWNLOAD_URL,
      win32:
        process.env.CALCIFY_WINDOWS_DOWNLOAD_URL ??
        DEFAULT_WINDOWS_DOWNLOAD_URL,
    },
    releaseNotesUrl: process.env.CALCIFY_RELEASE_NOTES_URL ?? null,
  });
}
