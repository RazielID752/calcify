import { Plus } from "lucide-react";
import { AdminTableBehavior } from "@/app/admin/components/admin-table-behavior";
import type { GroupsTableProps } from "@/app/admin/types/types";
import { Button } from "@/components/ui/button";
import { GroupsTableBody } from "./groups-table-body";
import { GroupsTableHead } from "./groups-table-head";

export function GroupsTable({
  groups,
  openActionsId,
  onCreateGroup,
  onToggleActions,
  onEditGroup,
  onDeleteGroup,
}: GroupsTableProps) {
  return (
    <AdminTableBehavior
      title="Grupos profissionais"
      description="Ao desativar um grupo, todas as contas vinculadas perdem acesso."
      action={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCreateGroup}
        >
          <Plus className="size-4" />
          Novo grupo
        </Button>
      }
    >
      <GroupsTableHead />
      <GroupsTableBody
        groups={groups}
        openActionsId={openActionsId}
        onToggleActions={onToggleActions}
        onEditGroup={onEditGroup}
        onDeleteGroup={onDeleteGroup}
      />
    </AdminTableBehavior>
  );
}
