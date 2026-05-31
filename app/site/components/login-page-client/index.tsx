"use client";

import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import useLogin from "@/app/site/hooks/useLogin";
import icon from "@/assets/icon-big.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPageClient() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    formState: { errors, isValid },
    errorMessage,
    isLoading: isSubmitting,
    onSubmit,
    loginFormSchema,
  } = useLogin();

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="flex items-center gap-10 py-8 mx-auto">
          <div className="w-full max-w-107.5 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_24px_70px_rgb(24_24_27/0.10)] sm:p-8">
            <div className="mb-8">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-semibold text-zinc-950"
                aria-label="Calcify"
              >
                <Image
                  src={icon}
                  alt=""
                  className="size-9 rounded-[10px] shadow-sm shadow-zinc-950/10"
                />
                <span className="hidden text-sm tracking-normal sm:inline">
                  Calcify
                </span>
              </Link>
              <div className="mt-3">
                <h2 className="text-3xl font-semibold tracking-normal">
                  Entrar na conta
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Acesse o editor e desfrute de uma experiência melhor, e
                  continue de onde parou.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="login"
                  className="text-xs font-medium text-zinc-600"
                >
                  Login
                </label>
                <Input
                  id="login"
                  type="text"
                  placeholder="Digite seu login"
                  autoComplete="username"
                  autoFocus
                  className="h-11 bg-zinc-50 focus-visible:bg-white"
                  aria-invalid={errors.login ? "true" : "false"}
                  {...register("login", loginFormSchema.login)}
                />
                {errors.login ? (
                  <p className="text-xs text-red-600">{errors.login.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-zinc-600"
                >
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="h-11 bg-zinc-50 pr-10 focus-visible:bg-white"
                    aria-invalid={errors.password ? "true" : "false"}
                    {...register("password", loginFormSchema.password)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={
                      isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
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
                {errors.password ? (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full gap-2 bg-zinc-950 text-white hover:bg-zinc-800"
                disabled={!isValid || isSubmitting}
              >
                <LogIn className="size-4" />
                {isSubmitting ? "Entrando..." : "Fazer login"}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-700" />
              Sessão protegida pelo controle de acesso do Calcify.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}