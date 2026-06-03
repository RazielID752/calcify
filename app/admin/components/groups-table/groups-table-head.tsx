import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GroupsTableHead() {
  return (
    <TableHeader className="hidden md:table-header-group">
      <TableRow className="border-zinc-200 hover:bg-transparent">
        <TableHead className="w-[44%] text-xs font-medium text-zinc-500">
          Grupo
        </TableHead>
        <TableHead className="w-[20%] text-xs font-medium text-zinc-500">
          Contas
        </TableHead>
        <TableHead className="w-[24%] text-xs font-medium text-zinc-500">
          Status
        </TableHead>
        <TableHead className="w-16 text-right text-xs font-medium text-zinc-500">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
