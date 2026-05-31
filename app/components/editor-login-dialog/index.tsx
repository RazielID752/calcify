"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type EditorLoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueLogin: (credentials: {
    login: string;
    password: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string;
};

type LoginFormValues = {
  login: string;
  password: string;
};

export default function EditorLoginDialog({
  open,
  onOpenChange,
  onContinueLogin,
  isSubmitting = false,
  errorMessage = "",
}: EditorLoginDialogProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      login: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setIsPasswordVisible(false);
    }
  }, [open, reset]);

  const onSubmit = async (values: LoginFormValues) => {
    await onContinueLogin({
      login: values.login.trim(),
      password: values.password,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar na conta</DialogTitle>
          <DialogDescription className="pb-4">
            Faça login para conectar sua conta ao Calcify e sincronizar seus
            documentos.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <label
              htmlFor="editor-login"
              className="text-xs font-medium text-zinc-600"
            >
              Login
            </label>
            <Input
              id="editor-login"
              type="text"
              placeholder="Digite seu login"
              autoComplete="username"
              aria-invalid={errors.login ? "true" : "false"}
              {...register("login", {
                required: "Informe seu login",
                validate: (value) =>
                  value.trim().length > 0 || "Informe seu login",
              })}
            />
            {errors.login ? (
              <p className="text-xs text-red-600">{errors.login.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="editor-password"
              className="text-xs font-medium text-zinc-600"
            >
              Senha
            </label>
            <div className="relative">
              <Input
                id="editor-password"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password", {
                  required: "Informe sua senha",
                })}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label={
                  isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                }
                onClick={() => setIsPasswordVisible((previous) => !previous)}
              >
                {isPasswordVisible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Entrando..." : "Fazer login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
