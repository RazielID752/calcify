import type { ReactNode } from "react";
import { Table } from "@/components/ui/table";

type AdminTableBehaviorProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AdminTableBehavior({
  title,
  description,
  action,
  children,
}: AdminTableBehaviorProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        {action}
      </div>

      <Table className="min-w-full" containerClassName="overflow-visible">
        {children}
      </Table>
    </section>
  );
}
