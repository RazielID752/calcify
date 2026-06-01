"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  DocumentGeneralAccess,
  DocumentShareSettings,
  DocumentUserAccess,
} from "@/app/interfaces/document-sharing";
import {
  ApiRequestError,
  fetchDocumentShareSettingsWithApi,
  inviteDocumentEditorWithApi,
  isGuid,
  updateDocumentShareAccessWithApi,
  updateDocumentSharedUserAccessWithApi,
} from "@/app/services/document.service";

const DEFAULT_SHARE_SETTINGS: DocumentShareSettings = {
  generalAccess: "private",
  owner: null,
  users: [],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => EMAIL_REGEX.test(email);

const createShareLink = (documentId: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  const shareUrl = new URL("/editor", window.location.origin);
  shareUrl.searchParams.set("document", documentId);

  return shareUrl.toString();
};

type UseDocumentSharingOptions = {
  activeDocumentId: string;
  authToken: string | null;
  onAuthExpired: () => void;
};

export const useDocumentSharing = ({
  activeDocumentId,
  authToken,
  onAuthExpired,
}: UseDocumentSharingOptions) => {
  const [activeSettings, setActiveSettings] = useState<DocumentShareSettings>(
    DEFAULT_SHARE_SETTINGS,
  );
  const [isLoadingShareSettings, setIsLoadingShareSettings] = useState(false);

  const loadShareSettings = useCallback(async () => {
    if (!authToken || !isGuid(activeDocumentId)) {
      setActiveSettings(DEFAULT_SHARE_SETTINGS);
      return;
    }

    setIsLoadingShareSettings(true);
    const loadingToastId = toast.loading("Carregando permissões...");

    try {
      const settings = await fetchDocumentShareSettingsWithApi(
        authToken,
        activeDocumentId,
      );
      setActiveSettings(settings);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        toast.dismiss(loadingToastId);
        onAuthExpired();
        return;
      }

      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Não foi possível carregar as permissões.";
      toast.error(message, { id: loadingToastId });
      return;
    } finally {
      setIsLoadingShareSettings(false);
    }

    toast.dismiss(loadingToastId);
  }, [activeDocumentId, authToken, onAuthExpired]);

  useEffect(() => {
    void loadShareSettings();
  }, [loadShareSettings]);

  const setGeneralAccess = useCallback(
    async (generalAccess: DocumentGeneralAccess) => {
      if (!authToken || !isGuid(activeDocumentId)) {
        return;
      }

      setActiveSettings((settings) => ({ ...settings, generalAccess }));

      try {
        const settings = await updateDocumentShareAccessWithApi(
          authToken,
          activeDocumentId,
          generalAccess,
        );
        setActiveSettings(settings);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          onAuthExpired();
          return;
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível atualizar o acesso.";
        toast.error(message);
        await loadShareSettings();
      }
    },
    [activeDocumentId, authToken, loadShareSettings, onAuthExpired],
  );

  const inviteEditor = useCallback(
    async (email: string, access: DocumentUserAccess) => {
      const normalizedEmail = normalizeEmail(email);

      if (!isValidEmail(normalizedEmail)) {
        return { ok: false, message: "Informe um e-mail válido." };
      }

      if (!authToken || !isGuid(activeDocumentId)) {
        return {
          ok: false,
          message: "Salve o documento antes de compartilhar.",
        };
      }

      try {
        const settings = await inviteDocumentEditorWithApi(
          authToken,
          activeDocumentId,
          normalizedEmail,
          access,
        );
        setActiveSettings(settings);

        return { ok: true, message: "" };
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          onAuthExpired();
          return { ok: false, message: "" };
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível compartilhar o documento.";

        toast.error(message);

        return { ok: false, message: "" };
      }
    },
    [activeDocumentId, authToken, onAuthExpired],
  );

  const updateUserAccess = useCallback(
    async (shareId: string, access: DocumentUserAccess) => {
      if (!authToken || !isGuid(activeDocumentId)) {
        return;
      }

      try {
        const settings = await updateDocumentSharedUserAccessWithApi(
          authToken,
          activeDocumentId,
          shareId,
          access,
        );
        setActiveSettings(settings);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          onAuthExpired();
          return;
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível atualizar a permissão.";
        toast.error(message);
        await loadShareSettings();
      }
    },
    [activeDocumentId, authToken, loadShareSettings, onAuthExpired],
  );

  const shareLink = useMemo(
    () => createShareLink(activeDocumentId),
    [activeDocumentId],
  );

  return {
    activeSettings,
    inviteEditor,
    isLoadingShareSettings,
    loadShareSettings,
    setGeneralAccess,
    shareLink,
    updateUserAccess,
  };
};

export type {
  DocumentGeneralAccess,
  DocumentShareSettings,
  DocumentUserAccess,
};
