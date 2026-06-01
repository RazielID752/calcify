"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_STORAGE_KEY = "calcify_cookie_consent_v1";
const publicSitePaths = ["/", "/site", "/privacidade", "/desktop"];

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const isPublicSitePath = publicSitePaths.includes(pathname);

  useEffect(() => {
    setIsVisible(
      isPublicSitePath && !localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
    );
  }, [isPublicSitePath]);

  const saveConsent = (value: "accepted" | "closed") => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-3 left-3 z-50 mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white/95 p-4 text-zinc-950 shadow-[0_24px_70px_rgb(24_24_27/0.16)] backdrop-blur sm:right-5 sm:bottom-5 sm:left-auto sm:w-full sm:max-w-md">
      <p className="text-sm font-semibold">Cookies no Calcify</p>
      <p className="mt-1 text-sm leading-6 text-zinc-600">
        Usamos cookies necessários para manter sua sessão e melhorar sua
        experiência. Ao continuar, você concorda com nossa{" "}
        <Link
          href="/privacidade"
          className="font-medium text-emerald-700 underline-offset-4 hover:underline"
        >
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => saveConsent("closed")}
        >
          Fechar
        </Button>
        <Button type="button" onClick={() => saveConsent("accepted")}>
          Aceitar cookies
        </Button>
      </div>
    </div>
  );
}
