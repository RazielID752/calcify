"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
export default function SignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12">
      <section className="mx-auto max-w-md space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <Link href="/" className="font-semibold">
          Calcify
        </Link>
        <h1 className="text-3xl font-semibold">Crie sua conta</h1>
        <p className="text-sm text-zinc-600">
          Premium por um mês de teste com cartão. Depois, R$ 23,99/mês
          automaticamente, salvo cancelamento. Um teste por CPF.
        </p>
        {done ? (
          <div aria-live="polite" className="space-y-4">
            <p>{done}</p>
            <Link className="underline" href="/login?next=/assinatura">
              Entrar para continuar
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setBusy(true);
              setError("");
              try {
                const response = await apiClient.post<{ message: string }>(
                  "/api/account/register",
                  Object.fromEntries(data),
                );
                setDone(response.data.message);
              } catch (e) {
                setError(getApiErrorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="signup-name" className="block text-sm">
              Nome
              <Input
                id="signup-name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
            <label htmlFor="signup-email" className="block text-sm">
              E-mail
              <Input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
              />
            </label>
            <label htmlFor="signup-cpf" className="block text-sm">
              CPF
              <Input
                id="signup-cpf"
                name="cpf"
                inputMode="numeric"
                required
                maxLength={14}
              />
            </label>
            <p className="text-xs text-zinc-500">
              Usado para vincular sua conta e impedir a repetição do teste
              gratuito.
            </p>
            <label htmlFor="signup-password" className="block text-sm">
              Senha
              <Input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </label>
            <p className="text-xs text-zinc-500">
              Use letras maiúsculas, minúsculas, e números.
            </p>
            <label className="flex gap-2 text-sm">
              <input required type="checkbox" />{" "}
              <span>
                Li a{" "}
                <Link href="/privacidade" target="_blank" className="underline">
                  política de privacidade
                </Link>
                .
              </span>
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={busy}>
              {busy ? "Criando conta…" : "Criar conta"}
            </Button>
          </form>
        )}
        <p className="text-sm">
          Já possui conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
