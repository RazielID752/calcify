import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  canCreateAdminAccessProfile,
  emptyGroupForm,
  emptyUserForm,
  getGroupForm,
  getUserForm,
} from "@/app/admin/components/admin-page/admin-page-config";
import type { GroupForm, UserForm } from "@/app/admin/types/types";
import useSonner from "@/app/hooks/useSonner";
import type {
  AdminAccessGroup,
  AdminAccessOverview,
  AdminAccessUser,
} from "@/app/interfaces/admin-access";
import {
  createAdminAccessGroup,
  createAdminAccessUser,
  deleteAdminAccessGroup,
  fetchAdminAccessOverview,
  generateAdminTemporaryPassword,
  updateAdminAccessGroup,
  updateAdminAccessUser,
} from "@/app/services/admin-access.service";
import {
  getStoredAuthUser,
  hasStoredAuthSession,
  isAdminUser,
} from "@/utils/auth-session";

export function useAdminPage() {
  const router = useRouter();
  const { error: showError, success: showSuccess } = useSonner();
  const [overview, setOverview] = useState<AdminAccessOverview>({
    groups: [],
    users: [],
  });
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [temporaryPasswordOwner, setTemporaryPasswordOwner] = useState("");
  const [generatingPasswordUserId, setGeneratingPasswordUserId] = useState<
    string | null
  >(null);

  const activeUsersCount = overview.users.filter(
    (user) => user.effectiveAccess,
  ).length;

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      setOverview(await fetchAdminAccessOverview());
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao carregar.");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!hasStoredAuthSession()) {
      router.replace("/login?next=/admin");
      return;
    }

    const storedUser = getStoredAuthUser();

    if (storedUser?.mustChangePassword) {
      router.replace("/change-password?next=/admin");
      return;
    }

    if (!isAdminUser(storedUser)) {
      router.replace("/editor");
      return;
    }

    setIsAllowed(true);
    void loadOverview();
  }, [loadOverview, router]);

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  };

  const openCreateGroupDialog = () => {
    resetGroupForm();
    setOpenActionsId(null);
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: AdminAccessGroup) => {
    setEditingGroupId(group.id);
    setGroupForm(getGroupForm(group));
    setOpenActionsId(null);
    setGroupDialogOpen(true);
  };

  const openCreateUserDialog = () => {
    resetUserForm();
    setOpenActionsId(null);
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: AdminAccessUser) => {
    setEditingUserId(user.id);
    setUserForm(getUserForm(user));
    setTemporaryPassword("");
    setTemporaryPasswordOwner("");
    setOpenActionsId(null);
    setUserDialogOpen(true);
  };

  const closeGroupDialog = (open: boolean) => {
    setGroupDialogOpen(open);

    if (!open) {
      resetGroupForm();
    }
  };

  const closeUserDialog = (open: boolean) => {
    setUserDialogOpen(open);

    if (!open) {
      resetUserForm();
    }
  };

  const handleSaveGroup = async () => {
    const name = groupForm.name.trim();

    if (!name) {
      showError("Informe o nome do grupo.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingGroupId) {
        await updateAdminAccessGroup(editingGroupId, {
          ...groupForm,
          name,
        });
        showSuccess("Grupo atualizado.");
      } else {
        await createAdminAccessGroup({ ...groupForm, name });
        showSuccess("Grupo criado.");
      }

      setGroupDialogOpen(false);
      resetGroupForm();
      await loadOverview();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (group: AdminAccessGroup) => {
    setOpenActionsId(null);

    const shouldDelete = window.confirm(
      `Excluir o grupo "${group.name}"? As contas vinculadas ficarão individuais.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);

    try {
      await deleteAdminAccessGroup(group.id);
      showSuccess("Grupo excluído.");
      await loadOverview();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao excluir.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async () => {
    const name = userForm.name.trim();
    const email = userForm.email.trim().toLowerCase();

    if (!name || !email) {
      showError("Informe nome e e-mail.");
      return;
    }

    if (!canCreateAdminAccessProfile(userForm.profile)) {
      showError("Este perfil não pode ser criado.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: UserForm = {
        ...userForm,
        name,
        email,
      };

      if (editingUserId) {
        await updateAdminAccessUser(editingUserId, payload);
        setTemporaryPassword("");
        setTemporaryPasswordOwner("");
        showSuccess("Conta atualizada.");
      } else {
        const createdUser = await createAdminAccessUser(payload);
        setTemporaryPassword(createdUser.temporaryPassword);
        setTemporaryPasswordOwner(createdUser.email);
        showSuccess("Conta criada com senha temporária.");
      }

      setUserDialogOpen(false);
      resetUserForm();
      await loadOverview();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetachUserFromGroup = async (user: AdminAccessUser) => {
    setOpenActionsId(null);

    try {
      await updateAdminAccessUser(user.id, {
        ...getUserForm(user),
        accessGroupId: null,
      });
      showSuccess("Conta desassociada do grupo.");
      await loadOverview();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao desassociar conta.",
      );
    }
  };

  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPassword) {
      return;
    }

    await navigator.clipboard.writeText(temporaryPassword);
    showSuccess("Senha temporária copiada.");
  };

  const handleGenerateTemporaryPassword = async (user: AdminAccessUser) => {
    setGeneratingPasswordUserId(user.id);
    setOpenActionsId(null);

    try {
      const response = await generateAdminTemporaryPassword(user.id);
      setTemporaryPassword(response.temporaryPassword);
      setTemporaryPasswordOwner(response.email);
      showSuccess("Senha temporária gerada.");
      await loadOverview();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao gerar senha.",
      );
    } finally {
      setGeneratingPasswordUserId(null);
    }
  };

  const toggleActions = (id: string) => {
    setOpenActionsId((current) => (current === id ? null : id));
  };

  return {
    activeUsersCount,
    closeGroupDialog,
    closeUserDialog,
    editingGroupId,
    editingUserId,
    generatingPasswordUserId,
    groupDialogOpen,
    groupForm,
    handleCopyTemporaryPassword,
    handleDeleteGroup,
    handleDetachUserFromGroup,
    handleGenerateTemporaryPassword,
    handleSaveGroup,
    handleSaveUser,
    isAllowed,
    isLoading,
    isSaving,
    loadOverview,
    openActionsId,
    openCreateGroupDialog,
    openCreateUserDialog,
    openEditGroupDialog,
    openEditUserDialog,
    overview,
    router,
    setGroupForm,
    setUserForm,
    temporaryPassword,
    temporaryPasswordOwner,
    toggleActions,
    userDialogOpen,
    userForm,
  };
}
