"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
export default function VerifyPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">Confirme seu e-mail</h1>
      <p>Confirme para continuar a contratação do Calcify Premium.</p>
      {!done && (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const params = new URLSearchParams(window.location.hash.slice(1));
              await apiClient.post("/api/account/verify", {
                userId: params.get("user"),
                token: params.get("token"),
              });
              window.history.replaceState(null, "", window.location.pathname);
              setDone(true);
              setMessage("E-mail confirmado.");
            } catch (e) {
              setMessage(getApiErrorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Confirmando…" : "Confirmar e-mail"}
        </Button>
      )}
      <output className="block">{message}</output>
      <Link href="/assinatura" className="underline">
        Continuar para minha assinatura
      </Link>
    </main>
  );
}
