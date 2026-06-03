import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { useGroupsTableActions } from "@/app/admin/hooks/use-groups-table";
import type { GroupsTableBodyProps } from "@/app/admin/types/types";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { GroupsTableRowActions } from "./groups-table-row-actions";

export function GroupsTableBody({
  groups,
  openActionsId,
  onToggleActions,
  onEditGroup,
  onDeleteGroup,
}: GroupsTableBodyProps) {
  const { isActionsOpen, toggleGroupActions } = useGroupsTableActions(
    openActionsId,
    onToggleActions,
  );

  if (groups.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell className="p-4 text-sm text-zinc-500" colSpan={4}>
            Nenhum grupo cadastrado.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {groups.map((group) => (
        <TableRow
          key={group.id}
          className="grid gap-3 border-zinc-200 px-4 py-4 hover:bg-zinc-50 md:table-row md:px-0 md:py-0"
        >
          <TableCell className="block min-w-0 px-0 py-0 md:table-cell md:px-4 md:py-4">
            <span className="flex items-center gap-2 truncate text-sm font-medium text-zinc-950">
              <Building2 className="size-4 text-emerald-700" />
              {group.name}
            </span>
          </TableCell>
          <TableCell className="block px-0 py-0 text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Contas:'] md:table-cell md:px-4 md:py-4 md:before:content-none">
            {group.usersCount} conta(s)
          </TableCell>
          <TableCell className="block px-0 py-0 md:table-cell md:px-4 md:py-4">
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
          </TableCell>
          <TableCell className="block overflow-visible px-0 py-0 md:table-cell md:px-4 md:py-4">
            <GroupsTableRowActions
              group={group}
              isOpen={isActionsOpen(group.id)}
              onToggle={() => toggleGroupActions(group.id)}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
