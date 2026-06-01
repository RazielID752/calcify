"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { LoginFormValues } from "@/app/forms/auth";
import { loginDefaultValues, loginFormSchema } from "@/app/forms/auth";
import useFetchStricht from "@/app/hooks/useFetchStricht";
import useSonner from "@/app/hooks/useSonner";
import type { LoginApiResponse } from "@/app/interfaces/auth";
import { loginRequest } from "@/app/services/login.service";
import {
  getStoredAuthUser,
  hasStoredAuthSession,
  persistAuthSession,
} from "@/utils/auth-session";

type UseLoginOptions = {
  onError?: (message: string) => void;
};

const getRedirectTarget = () => {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("next");

  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/editor";
  }

  return target;
};

export default function useLogin({
  onError: externalOnError,
}: UseLoginOptions = {}) {
  const router = useRouter();
  const { error: showError, success: showSuccess } = useSonner();
  const form = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: loginDefaultValues,
  });

  useEffect(() => {
    if (hasStoredAuthSession()) {
      if (getStoredAuthUser()?.mustChangePassword) {
        router.replace(
          `/change-password?next=${encodeURIComponent(getRedirectTarget())}`,
        );
        return;
      }

      router.replace(getRedirectTarget());
    }
  }, [router]);

  const onSuccess = useCallback(
    (response: { data: LoginApiResponse }) => {
      persistAuthSession(response.data);

      showSuccess("Login realizado com sucesso");

      window.setTimeout(() => {
        if (response.data.user.mustChangePassword) {
          router.replace(
            `/change-password?next=${encodeURIComponent(getRedirectTarget())}`,
          );
          return;
        }

        router.replace(getRedirectTarget());
      }, 250);
    },
    [router, showSuccess],
  );

  const onError = useCallback(
    (message: string, error: unknown) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.status === 400
          ? "Usuário ou senha inválidos"
          : message;

      showError(errorMessage);
      externalOnError?.(errorMessage);
    },
    [externalOnError, showError],
  );

  const loginFetch = useFetchStricht<LoginFormValues, LoginApiResponse>({
    request: loginRequest,
    onSuccess,
    onError,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await loginFetch.fetch(values).catch(() => {
      return;
    });
  });

  return {
    ...loginFetch,
    ...form,
    onSubmit,
    loginFormSchema,
    login: loginFetch.fetch,
  };
}
