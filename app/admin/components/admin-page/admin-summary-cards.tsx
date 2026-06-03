type AdminSummaryCardsProps = {
  usersCount: number;
  activeUsersCount: number;
  groupsCount: number;
};

export function AdminSummaryCards({
  usersCount,
  activeUsersCount,
  groupsCount,
}: AdminSummaryCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase">Contas</p>
        <strong className="mt-2 block text-2xl">{usersCount}</strong>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase">
          Com acesso
        </p>
        <strong className="mt-2 block text-2xl text-emerald-700">
          {activeUsersCount}
        </strong>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase">Grupos</p>
        <strong className="mt-2 block text-2xl">{groupsCount}</strong>
      </div>
    </section>
  );
}
