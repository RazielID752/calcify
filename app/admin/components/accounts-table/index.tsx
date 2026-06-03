import { AdminTableBehavior } from "@/app/admin/components/admin-table-behavior";
import type { AccountsTableProps } from "@/app/admin/types/types";
import { Button } from "@/components/ui/button";
import { AccountsTableBody } from "./accounts-table-body";
import { AccountsTableHead } from "./accounts-table-head";
import { RotateCcw } from "lucide-react";

export function AccountsTable({
  users,
  isLoading,
  openActionsId,
  generatingPasswordUserId,
  onRefresh,
  onToggleActions,
  onEditUser,
  onGenerateTemporaryPassword,
  onDetachUserFromGroup,
}: AccountsTableProps) {
  return (
    <AdminTableBehavior
      title="Contas cadastradas"
      description="Contas individuais ou vinculadas a grupos."
      action={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <RotateCcw />
          Atualizar
        </Button>
      }
    >
      <AccountsTableHead />
      <AccountsTableBody
        users={users}
        isLoading={isLoading}
        openActionsId={openActionsId}
        generatingPasswordUserId={generatingPasswordUserId}
        onToggleActions={onToggleActions}
        onEditUser={onEditUser}
        onGenerateTemporaryPassword={onGenerateTemporaryPassword}
        onDetachUserFromGroup={onDetachUserFromGroup}
      />
    </AdminTableBehavior>
  );
}
