import { useAdminTableBehavior } from "@/app/admin/hooks/use-admin-table-behavior";

const groupActionPrefix = "group";

export function useGroupsTableActions(
  openActionsId: string | null,
  onToggleActions: (id: string) => void,
) {
  const behavior = useAdminTableBehavior({
    actionPrefix: groupActionPrefix,
    openActionsId,
    onToggleActions,
  });

  return {
    getActionId: behavior.getActionId,
    isActionsOpen: behavior.isActionsOpen,
    toggleGroupActions: behavior.toggleRowActions,
  };
}
