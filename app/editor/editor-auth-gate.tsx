"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
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

    setIsAllowed(true);
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
