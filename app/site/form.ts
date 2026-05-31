import type { RegisterOptions } from "react-hook-form";

export type LoginFormValues = {
  login: string;
  password: string;
};

export const loginDefaultValues: LoginFormValues = {
  login: "",
  password: "",
};

export const loginFormSchema: Record<
  keyof LoginFormValues,
  RegisterOptions<LoginFormValues>
> = {
  login: {
    required: "Informe seu login",
    validate: (value) => value.trim().length > 0 || "Informe seu login",
  },
  password: {
    required: "Informe sua senha",
  },
};
