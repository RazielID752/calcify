"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasStoredAuthSession } from "@/utils/auth-session";

const EDITOR_ROUTE = "/editor";
const LOGIN_ROUTE = `/login?next=${encodeURIComponent(EDITOR_ROUTE)}`;

export default function DesktopEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasStoredAuthSession() ? EDITOR_ROUTE : LOGIN_ROUTE);
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4 text-zinc-600">
      <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white/80 px-4 py-3 text-sm shadow-sm">
        <span className="size-2.5 rounded-full bg-emerald-500" />
        Abrindo Calcify...
      </div>
    </main>
  );
}
