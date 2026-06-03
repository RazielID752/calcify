type UseAdminTableBehaviorOptions = {
  actionPrefix: string;
  openActionsId: string | null;
  onToggleActions: (id: string) => void;
};

export function useAdminTableBehavior({
  actionPrefix,
  openActionsId,
  onToggleActions,
}: UseAdminTableBehaviorOptions) {
  const getActionId = (rowId: string) => `${actionPrefix}-${rowId}`;

  return {
    getActionId,
    isActionsOpen: (rowId: string) => openActionsId === getActionId(rowId),
    toggleRowActions: (rowId: string) => onToggleActions(getActionId(rowId)),
  };
}
