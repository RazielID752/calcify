"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import icon from "@/assets/icon-big.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveApiBaseUrl } from "@/utils/api-client";
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  getStoredAuthUser,
} from "@/utils/auth-session";

const MIN_PASSWORD_LENGTH = 8;

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/editor";
  }

  return value;
};

const isValidPassword = (password: string) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password);

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
      router.replace("/login?next=/change-password");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!temporaryPassword.trim()) {
      setErrorMessage("Informe a senha temporária.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setErrorMessage(
        "A nova senha precisa ter 8 caracteres, letra maiúscula, minúscula e número.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!token) {
      router.replace("/login?next=/change-password");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: temporaryPassword,
            newPassword,
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          Message?: string;
        };
        throw new Error(
          data.message ?? data.Message ?? "Não foi possível alterar a senha.",
        );
      }

      const storedUser = getStoredAuthUser();

      if (storedUser) {
        localStorage.setItem(
          AUTH_USER_STORAGE_KEY,
          JSON.stringify({
            ...storedUser,
            mustChangePassword: false,
          }),
        );
      }

      toast.success("Senha definitiva criada.");
      router.replace(getSafeNextPath(searchParams.get("next")));
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Não foi possível alterar a senha.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto flex items-center py-8">
          <div className="w-full max-w-107.5 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_24px_70px_rgb(24_24_27/0.10)] sm:p-8">
            <div className="mb-8">
              <div className="flex items-center gap-2.5 font-semibold text-zinc-950">
                <Image
                  src={icon}
                  alt=""
                  className="size-9 rounded-[10px] shadow-sm shadow-zinc-950/10"
                />
                <span className="hidden text-sm tracking-normal sm:inline">
                  Calcify
                </span>
              </div>
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-normal">
                  Criar senha definitiva
                </h1>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Use a senha temporária recebida e defina sua senha final.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="temporary-password"
                  className="text-xs font-medium text-zinc-600"
                >
                  Senha temporária
                </label>
                <Input
                  id="temporary-password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={temporaryPassword}
                  className="h-11 bg-zinc-50 focus-visible:bg-white"
                  autoComplete="current-password"
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-xs font-medium text-zinc-600"
                >
                  Nova senha
                </label>
                <Input
                  id="new-password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={newPassword}
                  className="h-11 bg-zinc-50 focus-visible:bg-white"
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-medium text-zinc-600"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    className="h-11 bg-zinc-50 pr-10 focus-visible:bg-white"
                    autoComplete="new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={
                      isPasswordVisible ? "Ocultar senhas" : "Mostrar senhas"
                    }
                    onClick={() =>
                      setIsPasswordVisible((previous) => !previous)
                    }
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full gap-2 bg-zinc-950 text-white hover:bg-zinc-800"
                disabled={isSubmitting}
              >
                <KeyRound className="size-4" />
                {isSubmitting ? "Salvando..." : "Salvar senha definitiva"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f6f8f5_48%,#ffffff_100%)] px-4 text-zinc-950">
          <div className="w-full max-w-80 rounded-lg border border-zinc-200 bg-white/90 p-6 text-center shadow-[0_24px_70px_rgb(24_24_27/0.10)] backdrop-blur">
            <div className="mx-auto mb-4 grid size-13 place-items-center rounded-[14px] bg-emerald-50 shadow-sm shadow-zinc-950/10">
              <Image
                src={icon}
                alt=""
                className="size-9 rounded-[10px]"
                priority
              />
            </div>
            <div className="mx-auto mb-4 size-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
            <p className="text-sm font-semibold text-zinc-900">
              Preparando troca de senha
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Validando sua sessão para continuar com segurança.
            </p>
          </div>
        </main>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
