import {
  getAccessLabel,
  useAccountsTableActions,
} from "@/app/admin/hooks/use-accounts-table";
import type { AccountsTableBodyProps } from "@/app/admin/types/types";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AccountsTableRowActions } from "./accounts-table-row-actions";

export function AccountsTableBody({
  users,
  isLoading,
  openActionsId,
  generatingPasswordUserId,
  onToggleActions,
  onEditUser,
  onGenerateTemporaryPassword,
  onDetachUserFromGroup,
}: AccountsTableBodyProps) {
  const { isActionsOpen, toggleUserActions } = useAccountsTableActions(
    openActionsId,
    onToggleActions,
  );

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell className="p-4 text-sm text-zinc-500" colSpan={5}>
            Carregando contas...
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (users.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell className="p-4 text-sm text-zinc-500" colSpan={5}>
            Nenhuma conta cadastrada.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {users.map((user) => (
        <TableRow
          key={user.id}
          className="grid gap-3 border-zinc-200 px-4 py-4 hover:bg-zinc-50 md:table-row md:px-0 md:py-0"
        >
          <TableCell className="block min-w-0 px-0 py-0 md:table-cell md:px-4 md:py-4">
            <span className="block truncate text-sm font-medium text-zinc-950">
              {user.name}
            </span>
            <span className="block truncate text-xs text-zinc-500">
              {user.email}
            </span>
          </TableCell>
          <TableCell className="block px-0 py-0 text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Perfil:'] md:table-cell md:px-4 md:py-4 md:before:content-none">
            {user.profile}
          </TableCell>
          <TableCell className="block px-0 py-0 text-sm text-zinc-700 before:mr-1 before:text-xs before:font-medium before:text-zinc-500 before:content-['Grupo:'] md:table-cell md:px-4 md:py-4 md:before:content-none">
            {user.accessGroupName ?? "Conta individual"}
          </TableCell>
          <TableCell className="block overflow-visible px-0 py-0 md:table-cell md:px-4 md:py-4">
            <span
              className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-medium ${
                user.effectiveAccess
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {getAccessLabel(user)}
            </span>
          </TableCell>
          <TableCell className="block px-0 py-0 md:table-cell md:px-4 md:py-4">
            <AccountsTableRowActions
              user={user}
              isOpen={isActionsOpen(user.id)}
              isGeneratingPassword={generatingPasswordUserId === user.id}
              onToggle={() => toggleUserActions(user.id)}
              onEditUser={onEditUser}
              onGenerateTemporaryPassword={onGenerateTemporaryPassword}
              onDetachUserFromGroup={onDetachUserFromGroup}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
