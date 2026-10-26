"use client";
import { useCallback, useEffect, useState } from "react";
import {
  authConfig,
  type BillingSummary,
} from "@/app/services/billing.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { billingDate, paymentLabel, statusLabel } from "@/lib/billing-state";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
export default function SubscriptionsTable() {
  const [items, setItems] = useState<BillingSummary[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [grant, setGrant] = useState<BillingSummary | null>(null);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await apiClient.get<{
        items: BillingSummary[];
        total: number;
      }>(
        `/api/billing/admin?${new URLSearchParams({ search, status, page: String(page) })}`,
        authConfig(),
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [search, status, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);
  const synchronize = async (id: string) => {
    setBusy(true);
    try {
      await apiClient.post(`/api/billing/admin/${id}/sync`, {}, authConfig());
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Assinaturas</h2>
          <p className="text-sm text-zinc-500">
            {total} usuários. Concessão gratuita não altera o pagamento no
            Stripe.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          Atualizar lista
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Buscar assinaturas"
          placeholder="Nome ou e-mail"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <select
          aria-label="Filtrar assinaturas"
          className="rounded-md border px-3"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os estados</option>
          <option value="trialing">Em teste</option>
          <option value="active">Ativas</option>
          <option value="past_due">Pagamento pendente</option>
          <option value="canceling">Cancelamento agendado</option>
          <option value="canceled">Encerradas</option>
          <option value="grant">Concessão gratuita</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Usuário",
                "Acesso / assinatura",
                "Pagamento",
                "Datas",
                "Ações",
              ].map((label) => (
                <th key={label} className="border-b p-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.userId}>
                <td className="border-b p-3">
                  <p className="font-medium">{a.name}</p>
                  <p>{a.email}</p>
                  <p className="text-xs text-zinc-500">{a.profile}</p>
                </td>
                <td className="border-b p-3">
                  <p>{statusLabel(a.status)}</p>
                  <p>{a.hasPremium ? "Premium liberado" : "Sem Premium"}</p>
                  {a.grantUntil && (
                    <p>Concessão: {billingDate(a.grantUntil)}</p>
                  )}
                  {a.cancelAtPeriodEnd && (
                    <p className="text-amber-700">Cancelamento agendado</p>
                  )}
                  {a.accessBlocked && (
                    <p className="text-red-700">
                      Bloqueado administrativamente. Revise a cobrança no
                      Stripe.
                    </p>
                  )}
                </td>
                <td className="border-b p-3">
                  {paymentLabel(a.paymentStatus)}
                  <p className="text-xs text-zinc-500">
                    Atualizado: {billingDate(a.syncedAt)}
                  </p>
                </td>
                <td className="border-b p-3 whitespace-nowrap">
                  <p>Trial: {billingDate(a.trialEndsAt)}</p>
                  <p>Pago até: {billingDate(a.paidThrough)}</p>
                  <p>Próxima cobrança: {billingDate(a.nextPaymentAt)}</p>
                  <p>Encerramento: {billingDate(a.endsAt)}</p>
                </td>
                <td className="space-y-2 border-b p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void synchronize(a.userId)}
                  >
                    Sincronizar Stripe
                  </Button>
                  {a.stripeCustomerUrl && (
                    <a
                      href={a.stripeCustomerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block underline"
                    >
                      Cliente no Stripe
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGrant(a)}
                  >
                    Concessão gratuita
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={page === 1 || busy}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </Button>
        <span className="py-2">Página {page}</span>
        <Button
          variant="outline"
          disabled={page * 50 >= total || busy}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>
      {grant && (
        <form
          className="space-y-3 rounded-lg border bg-zinc-50 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget);
            const until = String(values.get("until") || "");
            setBusy(true);
            try {
              await apiClient.put(
                `/api/billing/admin/${grant.userId}/grant`,
                {
                  until: until ? new Date(until).toISOString() : null,
                  reason: values.get("reason"),
                },
                authConfig(),
              );
              setGrant(null);
              await load();
            } catch (err) {
              setError(getApiErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 className="font-semibold">Concessão para {grant.name}</h3>
          <p className="text-sm">
            Encerre a assinatura no Stripe antes de conceder gratuidade. Deixe a
            data vazia para revogar a concessão existente.
          </p>
          <label htmlFor="grant-until" className="block text-sm">
            Validade
            <Input type="datetime-local" id="grant-until" name="until" />
          </label>
          <label htmlFor="grant-reason" className="block text-sm">
            Motivo
            <Input id="grant-reason" name="reason" required maxLength={500} />
          </label>
          <div className="flex gap-3">
            <Button disabled={busy}>Salvar concessão</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGrant(null)}
            >
              Fechar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
