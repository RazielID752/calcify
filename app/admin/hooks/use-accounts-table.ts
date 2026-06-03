import { useAdminTableBehavior } from "@/app/admin/hooks/use-admin-table-behavior";
import type { AdminAccessUser } from "@/app/interfaces/admin-access";

const accountActionPrefix = "user";

export const getAccessLabel = (user: AdminAccessUser) => {
  if (!user.isActive) {
    return "Conta desativada";
  }

  if (user.accessGroupIsActive === false) {
    return "Grupo desativado";
  }

  return "Acesso ativo";
};

export function useAccountsTableActions(
  openActionsId: string | null,
  onToggleActions: (id: string) => void,
) {
  const behavior = useAdminTableBehavior({
    actionPrefix: accountActionPrefix,
    openActionsId,
    onToggleActions,
  });

  return {
    getActionId: behavior.getActionId,
    isActionsOpen: behavior.isActionsOpen,
    toggleUserActions: behavior.toggleRowActions,
  };
}
