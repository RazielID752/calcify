import type { LoginFormValues } from "@/app/site/form";
import { apiClient } from "@/utils/api-client";
import type { LoginApiResponse } from "@/utils/auth-api";

export const loginRequest = (values: LoginFormValues) =>
	apiClient.post<LoginApiResponse>("/api/auth/login", {
		email: values.login.trim(),
		password: values.password,
	});
