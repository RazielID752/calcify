import { apiClient, getApiErrorMessage, resolveApiBaseUrl } from "./api-client";
import type {
	LoginApiResponse,
	LoginCredentials,
} from "@/app/interfaces/auth";
import type {
  SpellcheckRuleApiResponse,
  SpellcheckRulePayload,
} from "@/app/interfaces/spellcheck";

const readField = <T>(
  source: Record<string, unknown>,
  camelCase: string,
  pascalCase: string,
) => {
  return (source[camelCase] ?? source[pascalCase]) as T | undefined;
};

const normalizeSpellcheckRuleResponse = (
  value: unknown,
): SpellcheckRuleApiResponse | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readField<string>(record, "id", "Id");
  const wrongWord = readField<string>(record, "wrongWord", "WrongWord");
  const correction = readField<string>(record, "correction", "Correction");
  const createdAt =
    readField<string>(record, "createdAt", "CreatedAt") ??
    new Date().toISOString();

  if (
    typeof id !== "string" ||
    typeof wrongWord !== "string" ||
    typeof correction !== "string"
  ) {
    return null;
  }

  return {
    id,
    wrongWord,
    correction,
    createdAt,
  };
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

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

export async function fetchSpellcheckRulesWithApi(token: string) {
  const response = await fetch(`${resolveApiBaseUrl()}/api/spellcheck/rules`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => ({}))) as
    | unknown[]
    | { message?: string; Message?: string };

  if (!response.ok) {
    throw new Error(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível carregar o dicionário personalizado.",
    );
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeSpellcheckRuleResponse)
    .filter((item): item is SpellcheckRuleApiResponse => item !== null);
}

export async function createSpellcheckRuleWithApi(
  token: string,
  payload: SpellcheckRulePayload,
) {
  const response = await fetch(`${resolveApiBaseUrl()}/api/spellcheck/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível salvar a regra ortográfica.",
    );
  }

  const normalizedData = normalizeSpellcheckRuleResponse(data);

  if (!normalizedData) {
    throw new Error("Resposta de regra ortográfica inválida.");
  }

  return normalizedData;
}

