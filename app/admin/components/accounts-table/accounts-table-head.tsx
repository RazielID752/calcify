import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AccountsTableHead() {
  return (
    <TableHeader className="hidden md:table-header-group">
      <TableRow className="border-zinc-200 hover:bg-transparent">
        <TableHead className="w-[32%] text-xs font-medium text-zinc-500">
          Conta
        </TableHead>
        <TableHead className="w-[16%] text-xs font-medium text-zinc-500">
          Perfil
        </TableHead>
        <TableHead className="w-[22%] text-xs font-medium text-zinc-500">
          Grupo
        </TableHead>
        <TableHead className="w-[22%] text-xs font-medium text-zinc-500">
          Acesso
        </TableHead>
        <TableHead className="w-16 text-right text-xs font-medium text-zinc-500">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
