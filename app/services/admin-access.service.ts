import type {
  AdminAccessGroupPayload,
  AdminAccessOverview,
  AdminAccessUserPayload,
  AdminCreatedUser,
  AdminGeneratedTemporaryPassword,
} from "@/app/interfaces/admin-access";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
import { AUTH_TOKEN_STORAGE_KEY } from "@/utils/auth-session";

const getAuthorizationHeader = () => {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchAdminAccessOverview() {
  try {
    const response = await apiClient.get<AdminAccessOverview>(
      "/api/admin/access",
      { headers: getAuthorizationHeader() },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar os acessos."),
    );
  }
}

export async function createAdminAccessGroup(payload: AdminAccessGroupPayload) {
  try {
    await apiClient.post("/api/admin/groups", payload, {
      headers: getAuthorizationHeader(),
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar o grupo."),
    );
  }
}

export async function updateAdminAccessGroup(
  groupId: string,
  payload: AdminAccessGroupPayload,
) {
  try {
    await apiClient.put(`/api/admin/groups/${groupId}`, payload, {
      headers: getAuthorizationHeader(),
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar o grupo."),
    );
  }
}

export async function deleteAdminAccessGroup(groupId: string) {
  try {
    await apiClient.delete(`/api/admin/groups/${groupId}`, {
      headers: getAuthorizationHeader(),
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível excluir o grupo."),
    );
  }
}

export async function createAdminAccessUser(payload: AdminAccessUserPayload) {
  try {
    const response = await apiClient.post<AdminCreatedUser>(
      "/api/admin/users",
      payload,
      { headers: getAuthorizationHeader() },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar a conta."),
    );
  }
}

export async function updateAdminAccessUser(
  userId: string,
  payload: AdminAccessUserPayload,
) {
  try {
    await apiClient.put(`/api/admin/users/${userId}`, payload, {
      headers: getAuthorizationHeader(),
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar a conta."),
    );
  }
}

export async function generateAdminTemporaryPassword(userId: string) {
  try {
    const response = await apiClient.post<AdminGeneratedTemporaryPassword>(
      `/api/admin/users/${userId}/temporary-password`,
      {},
      { headers: getAuthorizationHeader() },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível gerar a senha temporária."),
    );
  }
}
