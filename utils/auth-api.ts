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

type DocumentListApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Array<{
    id: string;
    title: string;
    content: string;
    isDraft: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

type UpsertDocumentPayload = {
  title: string;
  content: string;
  isDraft: boolean;
};

type UpsertDocumentApiResponse = {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
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
): UpsertDocumentApiResponse | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readField<string>(record, "id", "Id");
  const title = readField<string>(record, "title", "Title");
  const content = readField<string>(record, "content", "Content");
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
    isDraft,
    createdAt,
    updatedAt,
  };
};

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

export async function fetchDocumentsWithApi(token: string) {
  const response = await fetch(`${resolveApiBaseUrl()}/api/documents`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
    return [];
  }

  return rawItems
    .map(normalizeDocumentResponse)
    .filter((item): item is UpsertDocumentApiResponse => item !== null);
}

export async function upsertDocumentWithApi(
  token: string,
  documentId: string,
  payload: UpsertDocumentPayload,
) {
  const shouldTryUpdate = GUID_REGEX.test(documentId);

  if (shouldTryUpdate) {
    const updateResponse = await fetch(
      `${resolveApiBaseUrl()}/api/documents/${documentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      };
      throw new Error(data.message ?? "Não foi possível salvar o documento.");
    }
  }

  const createResponse = await fetch(`${resolveApiBaseUrl()}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const createdData = await createResponse.json().catch(() => ({}));

  if (!createResponse.ok) {
    throw new Error(
      (createdData as { message?: string; Message?: string }).message ??
        (createdData as { message?: string; Message?: string }).Message ??
        "Não foi possível criar o documento.",
    );
  }

  const normalizedCreatedData = normalizeDocumentResponse(createdData);

  if (!normalizedCreatedData) {
    throw new Error("Resposta de criação de documento inválida.");
  }

  return normalizedCreatedData;
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
