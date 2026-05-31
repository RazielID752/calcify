"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { LoginFormValues } from "@/app/site/form";
import {
  loginDefaultValues,
  loginFormSchema,
} from "@/app/site/form";
import type { LoginApiResponse } from "@/utils/auth-api";
import {
  hasStoredAuthSession,
  persistAuthSession,
} from "@/utils/auth-session";
import { loginRequest } from "../services/login.service";
import useFetch from "../../hooks/useFetch";

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

export default function useLogin({ onError }: UseLoginOptions = {}) {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: loginDefaultValues,
  });

  useEffect(() => {
    if (hasStoredAuthSession()) {
      router.replace(getRedirectTarget());
    }
  }, [router]);

  const handleSuccess = useCallback(
    (response: { data: LoginApiResponse }) => {
      persistAuthSession(response.data);

      router.replace(getRedirectTarget());
    },
    [router],
  );

  const loginFetch = useFetch<LoginFormValues, LoginApiResponse>({
    request: loginRequest,
    onSuccess: handleSuccess,
    onError: (message) => onError?.(message),
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
