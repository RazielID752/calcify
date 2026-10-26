"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getBilling } from "@/app/services/billing.service";
import { billingDestination } from "@/lib/billing-state";
import { getStoredAuthUser, hasStoredAuthSession } from "@/utils/auth-session";

type EditorAuthGateProps = {
  children: ReactNode;
};

export default function EditorAuthGate({ children }: EditorAuthGateProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!hasStoredAuthSession()) {
      router.replace("/login?next=/editor");
      return;
    }

    if (getStoredAuthUser()?.mustChangePassword) {
      router.replace("/change-password?next=/editor");
      return;
    }

    let active = true;
    const verify = async () => {
      try {
        const billing = await getBilling();
        if (!active) return;
        const destination = billingDestination(billing);
        if (destination) {
          setIsAllowed(false);
          router.replace(destination);
        } else setIsAllowed(true);
      } catch {
        if (active) {
          setIsAllowed(false);
          router.replace("/assinatura");
        }
      }
    };
    void verify();
    const timer = window.setInterval(() => void verify(), 60000);
    const onFocus = () => void verify();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  if (!isAllowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-sm text-zinc-500">
        Carregando...
      </main>
    );
  }

  return children;
}
