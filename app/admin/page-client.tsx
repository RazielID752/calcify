"use client";

import {
  Building2,
  CheckCircle2,
  Copy,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Unlink,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSonner from "@/app/hooks/useSonner";
import type {
  AdminAccessGroup,
  AdminAccessOverview,
  AdminAccessUser,
  AdminAccessUserPayload,
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Perfis } from "@/enum/perfis.enum";
import {
  getStoredAuthUser,
  hasStoredAuthSession,
  isAdminUser,
} from "@/utils/auth-session";

const ungroupedValue = "none";

type GroupForm = {
  name: string;
  isActive: boolean;
};

type UserForm = AdminAccessUserPayload;

const emptyGroupForm: GroupForm = {
  name: "",
  isActive: true,
};

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  profile: Perfis.USER,
  isActive: true,
  accessGroupId: null,
};

const getAccessLabel = (user: AdminAccessUser) => {
  if (!user.isActive) {
    return "Conta desativada";
  }

  if (user.accessGroupIsActive === false) {
    return "Grupo desativado";
  }

  return "Acesso ativo";
};

const getUserForm = (user: AdminAccessUser): UserForm => ({
  name: user.name,
  email: user.email,
  profile: user.profile,
  isActive: user.isActive,
  accessGroupId: user.accessGroupId,
});

const getGroupForm = (group: AdminAccessGroup): GroupForm => ({
  name: group.name,
  isActive: group.isActive,
});

export default function AdminPageClient() {
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

  if (!isAllowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-sm text-zinc-500">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <ShieldCheck className="size-4" />
              Área administrativa
            </div>
            <h1 className="text-2xl font-semibold text-zinc-950">
              Controle de contas e acessos
            </h1>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={openCreateUserDialog}
            >
              <UserPlus className="size-4" />
              Criar conta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={openCreateGroupDialog}
            >
              <Plus className="size-4" />
              Criar grupo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/editor")}
            >
              Voltar ao editor
            </Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase">
              Contas
            </p>
            <strong className="mt-2 block text-2xl">
              {overview.users.length}
            </strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase">
              Com acesso
            </p>
            <strong className="mt-2 block text-2xl text-emerald-700">
              {activeUsersCount}
            </strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase">
              Grupos
            </p>
            <strong className="mt-2 block text-2xl">
              {overview.groups.length}
            </strong>
          </div>
        </section>

        {temporaryPassword ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-800 uppercase">
                  Senha temporária
                </p>
                {temporaryPasswordOwner ? (
                  <p className="mt-1 truncate text-sm text-emerald-800">
                    {temporaryPasswordOwner}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-sm text-emerald-900">
                  {temporaryPassword}
                </code>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => void handleCopyTemporaryPassword()}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Contas cadastradas</h2>
              <p className="text-xs text-zinc-500">
                Contas individuais ou vinculadas a grupos.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isLoading}
              onClick={() => void loadOverview()}
            >
              Atualizar
            </Button>
          </div>

          <div className="divide-y divide-zinc-200">
            {isLoading ? (
              <p className="p-4 text-sm text-zinc-500">Carregando contas...</p>
            ) : null}

            {!isLoading && overview.users.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">
                Nenhuma conta cadastrada.
              </p>
            ) : null}

            {overview.users.map((user) => (
              <div
                key={user.id}
                className="grid gap-3 px-4 py-4 hover:bg-zinc-50 md:grid-cols-[1.2fr_0.65fr_0.8fr_0.75fr_auto] md:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-950">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {user.email}
                  </span>
                </span>
                <span className="text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Perfil:'] md:before:content-none">
                  {user.profile}
                </span>
                <span className="text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Grupo:'] md:before:content-none">
                  {user.accessGroupName ?? "Conta individual"}
                </span>
                <span
                  className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-medium ${
                    user.effectiveAccess
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {getAccessLabel(user)}
                </span>
                <div className="relative flex justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Abrir ações da conta"
                    onClick={() => toggleActions(`user-${user.id}`)}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>

                  {openActionsId === `user-${user.id}` ? (
                    <div className="absolute top-10 right-0 z-20 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                        onClick={() => openEditUserDialog(user)}
                      >
                        <Pencil className="size-4" />
                        Editar conta
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        disabled={generatingPasswordUserId === user.id}
                        onClick={() =>
                          void handleGenerateTemporaryPassword(user)
                        }
                      >
                        <KeyRound className="size-4" />
                        {generatingPasswordUserId === user.id
                          ? "Gerando..."
                          : "Gerar senha"}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        disabled={!user.accessGroupId}
                        onClick={() => void handleDetachUserFromGroup(user)}
                      >
                        <Unlink className="size-4" />
                        Desassociar grupo
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Grupos profissionais</h2>
              <p className="text-xs text-zinc-500">
                Ao desativar um grupo, todas as contas vinculadas perdem acesso.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={openCreateGroupDialog}
            >
              <Plus className="size-4" />
              Novo grupo
            </Button>
          </div>

          <div className="divide-y divide-zinc-200">
            {overview.groups.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">
                Nenhum grupo cadastrado.
              </p>
            ) : null}

            {overview.groups.map((group) => (
              <div
                key={group.id}
                className="grid gap-3 px-4 py-4 hover:bg-zinc-50 md:grid-cols-[1.4fr_0.6fr_0.7fr_auto] md:items-center"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 truncate text-sm font-medium text-zinc-950">
                    <Building2 className="size-4 text-emerald-700" />
                    {group.name}
                  </span>
                </span>
                <span className="text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Contas:'] md:before:content-none">
                  {group.usersCount} conta(s)
                </span>
                <span
                  className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                    group.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {group.isActive ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  {group.isActive ? "Ativo" : "Desativado"}
                </span>
                <div className="relative flex justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Abrir ações do grupo"
                    onClick={() => toggleActions(`group-${group.id}`)}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>

                  {openActionsId === `group-${group.id}` ? (
                    <div className="absolute top-10 right-0 z-20 w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                        onClick={() => openEditGroupDialog(group)}
                      >
                        <Pencil className="size-4" />
                        Editar grupo
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                        onClick={() => void handleDeleteGroup(group)}
                      >
                        <Trash2 className="size-4" />
                        Excluir grupo
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={userDialogOpen} onOpenChange={closeUserDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUserId ? "Editar conta" : "Criar conta"}
            </DialogTitle>
            <DialogDescription>
              Configure o acesso individual ou vincule a conta a um grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Input
              value={userForm.name}
              placeholder="Nome"
              onChange={(event) =>
                setUserForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Input
              type="email"
              value={userForm.email}
              placeholder="E-mail"
              onChange={(event) =>
                setUserForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={userForm.profile}
                onValueChange={(value) =>
                  setUserForm((current) => ({
                    ...current,
                    profile: value as Perfis,
                  }))
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Perfis.USER}>Usuário</SelectItem>
                  <SelectItem value={Perfis.ADMIN}>Administrador</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={userForm.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setUserForm((current) => ({
                    ...current,
                    isActive: value === "active",
                  }))
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Conta ativa</SelectItem>
                  <SelectItem value="inactive">Conta desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={userForm.accessGroupId ?? ungroupedValue}
              onValueChange={(value) =>
                setUserForm((current) => ({
                  ...current,
                  accessGroupId: value === ungroupedValue ? null : value,
                }))
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ungroupedValue}>Conta individual</SelectItem>
                {overview.groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeUserDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSaveUser()}
            >
              {editingUserId ? "Salvar conta" : "Criar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={closeGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroupId ? "Editar grupo" : "Criar grupo"}
            </DialogTitle>
            <DialogDescription>
              Contas vinculadas seguem o status definido neste grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Input
              value={groupForm.name}
              placeholder="Nome do grupo"
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Select
              value={groupForm.isActive ? "active" : "inactive"}
              onValueChange={(value) =>
                setGroupForm((current) => ({
                  ...current,
                  isActive: value === "active",
                }))
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Grupo ativo</SelectItem>
                <SelectItem value="inactive">Grupo desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeGroupDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSaveGroup()}
            >
              {editingGroupId ? "Salvar grupo" : "Criar grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
