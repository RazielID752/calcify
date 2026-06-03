import { KeyRound, Pencil, Unlink } from "lucide-react";
import { AdminTableActions } from "@/app/admin/components/admin-table-actions";
import type { AdminAccessUser } from "@/app/interfaces/admin-access";

type AccountsTableRowActionsProps = {
  user: AdminAccessUser;
  isOpen: boolean;
  isGeneratingPassword: boolean;
  onToggle: () => void;
  onEditUser: (user: AdminAccessUser) => void;
  onGenerateTemporaryPassword: (user: AdminAccessUser) => void;
  onDetachUserFromGroup: (user: AdminAccessUser) => void;
};

export function AccountsTableRowActions({
  user,
  isOpen,
  isGeneratingPassword,
  onToggle,
  onEditUser,
  onGenerateTemporaryPassword,
  onDetachUserFromGroup,
}: AccountsTableRowActionsProps) {
  return (
    <AdminTableActions
      isOpen={isOpen}
      ariaLabel="Abrir ações da conta"
      onToggle={onToggle}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
        onClick={() => onEditUser(user)}
      >
        <Pencil className="size-4" />
        Editar conta
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        disabled={isGeneratingPassword}
        onClick={() => onGenerateTemporaryPassword(user)}
      >
        <KeyRound className="size-4" />
        {isGeneratingPassword ? "Gerando..." : "Gerar senha"}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        disabled={!user.accessGroupId}
        onClick={() => onDetachUserFromGroup(user)}
      >
        <Unlink className="size-4" />
        Desassociar grupo
      </button>
    </AdminTableActions>
  );
}
