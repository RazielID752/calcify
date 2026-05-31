import { apiClient, getApiErrorMessage, resolveApiBaseUrl } from "./api-client";
import type {
	LoginApiResponse,
	LoginCredentials,
} from "@/app/interfaces/auth";

export async function loginWithApi(credentials: LoginCredentials) {
  try {
    const response = await apiClient.post<Partial<LoginApiResponse>>(
      "/api/auth/login",
      {
        email: credentials.login.trim(),
        password: credentials.password,
      },
    );

    const payload = response.data;

    if (!payload.token || !payload.user) {
      throw new Error("Resposta de login inválida.");
    }

    return payload as LoginApiResponse;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível realizar o login."),
    );
  }
}

export async function logoutWithApi(token: string) {
  const response = await fetch(`${resolveApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(data.message ?? "Não foi possível sair da conta.");
  }
}

export {
	ApiRequestError,
	deleteDocumentWithApi,
	fetchDocumentWithApi,
	fetchDocumentsWithApi,
	isGuid,
	updateDocumentTitleWithApi,
	upsertDocumentWithApi,
} from "@/app/services/document.service";

