type LoginCredentials = {
  login: string;
  password: string;
};

type LoginApiResponse = {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    lastLoginAt: string | null;
  };
};

export type DocumentApiResponse = {
  id: string;
  title: string;
  content: string;
  clientDocumentId?: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
};

type DocumentListApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: DocumentApiResponse[];
};

type UpsertDocumentPayload = {
  title: string;
  content: string;
  isDraft: boolean;
  clientDocumentId?: string;
};

type UpsertDocumentOptions = {
  knownUpdatedAt?: string;
};

type SpellcheckRulePayload = {
  wrongWord: string;
  correction: string;
};

type SpellcheckRuleApiResponse = {
  id: string;
  wrongWord: string;
  correction: string;
  createdAt: string;
};

const DEFAULT_API_BASE_URL = "https://api-calcify-production.up.railway.app";
const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    "",
  );

const readField = <T>(
  source: Record<string, unknown>,
  camelCase: string,
  pascalCase: string,
) => {
  return (source[camelCase] ?? source[pascalCase]) as T | undefined;
};

const normalizeDocumentResponse = (
  value: unknown,
): DocumentApiResponse | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readField<string>(record, "id", "Id");
  const title = readField<string>(record, "title", "Title");
  const content = readField<string>(record, "content", "Content");
  const clientDocumentId =
    readField<string | null>(record, "clientDocumentId", "ClientDocumentId") ??
    null;
  const isDraft = readField<boolean>(record, "isDraft", "IsDraft") ?? false;
  const createdAt =
    readField<string>(record, "createdAt", "CreatedAt") ??
    new Date().toISOString();
  const updatedAt =
    readField<string>(record, "updatedAt", "UpdatedAt") ??
    new Date().toISOString();

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof content !== "string"
  ) {
    return null;
  }

  return {
    id,
    title,
    content,
    clientDocumentId,
    isDraft,
    createdAt,
    updatedAt,
  };
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
  const response = await fetch(`${resolveApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.login.trim(),
      password: credentials.password,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as
    | Partial<LoginApiResponse>
    | { message?: string };

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ??
      "Não foi possível realizar o login.";
    throw new Error(message);
  }

  const payload = data as Partial<LoginApiResponse>;

  if (!payload.token || !payload.user) {
    throw new Error("Resposta de login inválida.");
  }

  return payload as LoginApiResponse;
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

export async function fetchDocumentsWithApi(
  token: string,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: "createdAt" | "updatedAt";
  },
) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", `${options?.page ?? 1}`);
  searchParams.set("pageSize", `${options?.pageSize ?? 10}`);
  searchParams.set("sort", options?.sort ?? "updatedAt");

  if (options?.search?.trim()) {
    searchParams.set("search", options.search.trim());
  }

  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json().catch(() => ({}))) as
    | Partial<DocumentListApiResponse>
    | { message?: string };

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ??
      "Não foi possível carregar os documentos.";
    throw new Error(message);
  }

  const payload = data as Record<string, unknown>;
  const rawItems = (payload.items ?? payload.Items) as unknown;

  if (!Array.isArray(rawItems)) {
    return {
      items: [],
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 10,
      total: 0,
    };
  }

  const normalizedItems = rawItems
    .map(normalizeDocumentResponse)
    .filter((item): item is DocumentApiResponse => item !== null);

  return {
    items: normalizedItems,
    page:
      typeof payload.page === "number" ? payload.page : (options?.page ?? 1),
    pageSize:
      typeof payload.pageSize === "number"
        ? payload.pageSize
        : (options?.pageSize ?? 10),
    total:
      typeof payload.total === "number"
        ? payload.total
        : normalizedItems.length,
  };
}

export async function fetchDocumentWithApi(token: string, documentId: string) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível carregar o documento.",
      response.status,
    );
  }

  const normalizedData = normalizeDocumentResponse(data);

  if (!normalizedData) {
    throw new Error("Resposta de documento inválida.");
  }

  return normalizedData;
}

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

export async function upsertDocumentWithApi(
  token: string,
  documentId: string,
  payload: UpsertDocumentPayload,
  options?: UpsertDocumentOptions,
) {
  const shouldTryUpdate = GUID_REGEX.test(documentId);

  if (shouldTryUpdate) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (options?.knownUpdatedAt) {
      headers["If-Unmodified-Since"] = options.knownUpdatedAt;
    }

    const updateResponse = await fetch(
      `${resolveApiBaseUrl()}/api/documents/${documentId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (updateResponse.ok) {
      const data = await updateResponse.json().catch(() => ({}));
      const normalizedData = normalizeDocumentResponse(data);

      if (!normalizedData) {
        throw new Error("Resposta de atualização de documento inválida.");
      }

      return normalizedData;
    }

    if (updateResponse.status !== 404) {
      const data = (await updateResponse.json().catch(() => ({}))) as {
        message?: string;
        Message?: string;
      };
      throw new ApiRequestError(
        data.message ?? data.Message ?? "Não foi possível salvar o documento.",
        updateResponse.status,
      );
    }

    const data = (await updateResponse.json().catch(() => ({}))) as {
      message?: string;
      Message?: string;
    };
    throw new ApiRequestError(
      data.message ?? data.Message ?? "Documento não encontrado.",
      updateResponse.status,
    );
  }

  const createResponse = await fetch(`${resolveApiBaseUrl()}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...payload,
      clientDocumentId:
        payload.clientDocumentId ??
        (GUID_REGEX.test(documentId) ? undefined : documentId),
    }),
  });

  const createdData = await createResponse.json().catch(() => ({}));

  if (!createResponse.ok) {
    throw new ApiRequestError(
      (createdData as { message?: string; Message?: string }).message ??
        (createdData as { message?: string; Message?: string }).Message ??
        "Não foi possível criar o documento.",
      createResponse.status,
    );
  }

  const normalizedCreatedData = normalizeDocumentResponse(createdData);

  if (!normalizedCreatedData) {
    throw new Error("Resposta de criação de documento inválida.");
  }

  return normalizedCreatedData;
}

export async function updateDocumentTitleWithApi(
  token: string,
  documentId: string,
  title: string,
) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível editar o título do documento.",
      response.status,
    );
  }

  const normalizedData = normalizeDocumentResponse(data);

  if (!normalizedData) {
    throw new Error("Resposta de atualização de documento inválida.");
  }

  return normalizedData;
}

export function isGuid(value: string) {
  return GUID_REGEX.test(value);
}

export async function deleteDocumentWithApi(token: string, documentId: string) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.ok || response.status === 404) {
    return;
  }

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    Message?: string;
  };

  throw new Error(
    data.message ?? data.Message ?? "Não foi possível excluir o documento.",
  );
}
