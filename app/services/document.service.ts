import type {
  DocumentGeneralAccess,
  DocumentSharedUser,
  DocumentShareSettings,
  DocumentUserAccess,
} from "@/app/interfaces/document-sharing";
import type {
  DocumentApiResponse,
  DocumentListApiResponse,
  UpsertDocumentOptions,
  UpsertDocumentPayload,
} from "@/app/interfaces/documents";
import { resolveApiBaseUrl } from "@/utils/api-client";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const normalizeShareAccess = (value: unknown): DocumentGeneralAccess =>
  value === "public" ? "public" : "private";

const normalizeUserAccess = (value: unknown): DocumentUserAccess =>
  value === "editor" ? "editor" : "viewer";

const normalizeDocumentShareSettings = (
  value: unknown,
): DocumentShareSettings => {
  const fallback: DocumentShareSettings = {
    generalAccess: "private",
    owner: null,
    users: [],
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const owner = readField<Record<string, unknown>>(record, "owner", "Owner");
  const rawUsers = readField<unknown[]>(record, "users", "Users");
  const rawGeneralAccess = readField<unknown>(
    record,
    "generalAccess",
    "GeneralAccess",
  );

  return {
    generalAccess: normalizeShareAccess(rawGeneralAccess),
    owner:
      owner &&
      typeof owner.id === "string" &&
      typeof owner.name === "string" &&
      typeof owner.email === "string"
        ? {
            id: owner.id,
            name: owner.name,
            email: owner.email,
          }
        : null,
    users: Array.isArray(rawUsers)
      ? rawUsers
          .map((user): DocumentSharedUser | null => {
            if (!user || typeof user !== "object") {
              return null;
            }

            const userRecord = user as Record<string, unknown>;
            const id = readField<string>(userRecord, "id", "Id");
            const email = readField<string>(userRecord, "email", "Email");
            const name = readField<string>(userRecord, "name", "Name");
            const access = readField<string>(userRecord, "access", "Access");

            if (
              typeof id !== "string" ||
              typeof email !== "string" ||
              typeof name !== "string"
            ) {
              return null;
            }

            return {
              id,
              email,
              name,
              access: normalizeUserAccess(access),
            };
          })
          .filter((user): user is DocumentSharedUser => user !== null)
      : [],
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

export function isGuid(value: string) {
  return GUID_REGEX.test(value);
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
    throw new ApiRequestError(message, response.status);
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

  throw new ApiRequestError(
    data.message ?? data.Message ?? "Não foi possível excluir o documento.",
    response.status,
  );
}

export async function fetchDocumentShareSettingsWithApi(
  token: string,
  documentId: string,
) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}/share`,
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
        "Não foi possível carregar o compartilhamento.",
      response.status,
    );
  }

  return normalizeDocumentShareSettings(data);
}

export async function updateDocumentShareAccessWithApi(
  token: string,
  documentId: string,
  generalAccess: DocumentGeneralAccess,
) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}/share`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ generalAccess }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível atualizar o acesso.",
      response.status,
    );
  }

  return normalizeDocumentShareSettings(data);
}

export async function inviteDocumentEditorWithApi(
  token: string,
  documentId: string,
  email: string,
  access: DocumentUserAccess,
) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}/share/invite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, access }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível compartilhar o documento.",
      response.status,
    );
  }

  return normalizeDocumentShareSettings(data);
}

export async function updateDocumentSharedUserAccessWithApi(
  token: string,
  documentId: string,
  shareId: string,
  access: DocumentUserAccess,
) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/documents/${documentId}/share/users/${shareId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ access }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as { message?: string; Message?: string }).message ??
        (data as { message?: string; Message?: string }).Message ??
        "Não foi possível atualizar a permissão.",
      response.status,
    );
  }

  return normalizeDocumentShareSettings(data);
}
