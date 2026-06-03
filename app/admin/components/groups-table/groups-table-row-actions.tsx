import { Pencil, Trash2 } from "lucide-react";
import { AdminTableActions } from "@/app/admin/components/admin-table-actions";
import type { AdminAccessGroup } from "@/app/interfaces/admin-access";

type GroupsTableRowActionsProps = {
  group: AdminAccessGroup;
  isOpen: boolean;
  onToggle: () => void;
  onEditGroup: (group: AdminAccessGroup) => void;
  onDeleteGroup: (group: AdminAccessGroup) => void;
};

export function GroupsTableRowActions({
  group,
  isOpen,
  onToggle,
  onEditGroup,
  onDeleteGroup,
}: GroupsTableRowActionsProps) {
  return (
    <AdminTableActions
      isOpen={isOpen}
      ariaLabel="Abrir ações do grupo"
      menuClassName="w-48"
      onToggle={onToggle}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
        onClick={() => onEditGroup(group)}
      >
        <Pencil className="size-4" />
        Editar grupo
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
        onClick={() => onDeleteGroup(group)}
      >
        <Trash2 className="size-4" />
        Excluir grupo
      </button>
    </AdminTableActions>
  );
}
