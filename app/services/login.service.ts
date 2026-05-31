import type { LoginFormValues } from "@/app/forms/auth";
import { apiClient } from "@/utils/api-client";
import type { LoginApiResponse } from "@/app/interfaces/auth";

export const loginRequest = (values: LoginFormValues) =>
	apiClient.post<LoginApiResponse>("/api/auth/login", {
		email: values.login.trim(),
		password: values.password,
	});