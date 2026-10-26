"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  authConfig,
  type BillingSummary,
  getBilling,
  openStripe,
} from "@/app/services/billing.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  billingDate,
  paymentLabel,
  shouldRegularizeAutomatically,
  statusLabel,
} from "@/lib/billing-state";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
import { clearAuthSession, hasStoredAuthSession } from "@/utils/auth-session";
export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(async (sync = false) => {
    setError("");
    try {
      setData(await getBilling(sync));
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);
  useEffect(() => {
    if (!hasStoredAuthSession()) {
      router.replace("/login?next=/assinatura");
      return;
    }
    const returnedFromCheckout =
      new URLSearchParams(window.location.search).get("checkout") === "success";
    void load(returnedFromCheckout);
  }, [load, router]);
  useEffect(() => {
    if (!data || !shouldRegularizeAutomatically(data)) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("regularizar") !== "1") return;
    // Consume the redirect before leaving so Back preserves read-only access.
    url.searchParams.delete("regularizar");
    window.history.replaceState(window.history.state, "", url);
    setBusy(true);
    void openStripe("checkout").catch((e) => {
      setError(getApiErrorMessage(e));
      setBusy(false);
    });
  }, [data]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10">
      <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border bg-white p-6 sm:p-8">
        <Link href="/" className="font-semibold">
          Calcify
        </Link>
        <h1 className="text-3xl font-semibold">Minha assinatura</h1>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}
        {message && <output>{message}</output>}
        {!data ? (
          <Button onClick={() => void load()}>Carregar assinatura</Button>
        ) : (
          <>
            <div className="rounded-xl bg-emerald-50 p-5">
              <h2 className="text-xl font-semibold">Calcify Premium</h2>
              <p>R$ 23,99/mês</p>
              <p className="mt-2">
                {data.profile === "Administrador"
                  ? "Acesso administrativo"
                  : data.grantUntil && new Date(data.grantUntil) > new Date()
                    ? "Concessão gratuita"
                    : statusLabel(data.status)}
              </p>
            </div>
            {!data.enabled && (
              <p>
                Assinaturas em preparação. Seu acesso atual está preservado.
              </p>
            )}
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {[
                ["Pagamento", paymentLabel(data.paymentStatus)],
                ["Fim do teste", billingDate(data.trialEndsAt)],
                ["Período pago até", billingDate(data.paidThrough)],
                ["Próxima cobrança", billingDate(data.nextPaymentAt)],
                ["Concessão até", billingDate(data.grantUntil)],
                ["Última sincronização", billingDate(data.syncedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {data.cancelAtPeriodEnd && (
              <p className="rounded-lg bg-amber-50 p-3">
                Cancelamento agendado. Acesso até {billingDate(data.endsAt)}.
                Não haverá renovação.
              </p>
            )}
            {!data.hasPremium && (
              <p>
                Regularize sua assinatura para criar e editar. Seus documentos
                próprios continuam disponíveis para leitura e exportação.
              </p>
            )}
            {data.enabled &&
              !data.hasCpf &&
              data.profile !== "Administrador" && (
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cpf = new FormData(e.currentTarget).get("cpf");
                    void run(async () => {
                      await apiClient.post(
                        "/api/account/cpf",
                        { cpf },
                        authConfig(),
                      );
                      await load();
                    });
                  }}
                >
                  <label htmlFor="billing-cpf" className="text-sm">
                    Complete seu CPF
                    <Input
                      id="billing-cpf"
                      name="cpf"
                      required
                      maxLength={14}
                      inputMode="numeric"
                    />
                  </label>
                  <Button disabled={busy}>Vincular CPF</Button>
                </form>
              )}
            {data.enabled &&
              !data.emailVerified &&
              data.profile !== "Administrador" && (
                <div className="space-y-2">
                  <p>Confirme seu e-mail antes de contratar.</p>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await apiClient.post(
                          "/api/account/resend",
                          {},
                          authConfig(),
                        );
                        setMessage(
                          "Enviamos um link de confirmação ao seu e-mail.",
                        );
                      })
                    }
                  >
                    Reenviar confirmação
                  </Button>
                </div>
              )}
            {data.enabled &&
              !data.hasPremium &&
              data.emailVerified &&
              data.hasCpf && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600">
                    {data.trialEligible
                      ? "Cartão obrigatório. Um mês de teste, depois R$ 23,99/mês automaticamente, salvo cancelamento. A data será exibida no Stripe."
                      : "Seu teste gratuito já foi utilizado. Na nova contratação, a cobrança é imediata: R$ 23,99/mês, com renovação automática."}
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() => void run(() => openStripe("checkout"))}
                  >
                    {data.trialEligible
                      ? "Adicionar cartão e iniciar teste"
                      : "Regularizar no Stripe"}
                  </Button>
                </div>
              )}
            <div className="flex flex-wrap gap-3">
              {data.hasCustomer && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => void run(() => openStripe("portal"))}
                >
                  Gerenciar no Stripe
                </Button>
              )}
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  void run(async () => {
                    await load(true);
                  })
                }
              >
                Atualizar situação
              </Button>
              {data.hasPremium && (
                <Button asChild>
                  <Link href="/editor">Abrir editor</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/documentos">Meus documentos em modo leitura</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Após concluir o Stripe, atualize a situação. Enquanto confirmamos
              sua assinatura, não é necessário contratar novamente.
            </p>
            {data.profile !== "Administrador" && (
              <div className="border-t pt-5">
                <button
                  type="button"
                  className="text-sm text-red-700 underline"
                  onClick={() => setDeleting(!deleting)}
                >
                  Excluir minha conta
                </button>
                {deleting && (
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const password = new FormData(e.currentTarget).get(
                        "password",
                      );
                      void run(async () => {
                        await apiClient.delete("/api/account", {
                          ...authConfig(),
                          data: { password },
                        });
                        clearAuthSession();
                        router.replace("/");
                      });
                    }}
                  >
                    <p className="text-sm">
                      A exclusão encerra sua assinatura e remove seus
                      documentos. Exporte antes. O teste gratuito não será
                      concedido novamente. Cobranças já realizadas não são
                      reembolsadas automaticamente; contate o suporte para
                      análise.
                    </p>
                    <Input
                      name="password"
                      type="password"
                      required
                      placeholder="Confirme sua senha"
                      autoComplete="current-password"
                    />
                    <label className="flex gap-2 text-sm">
                      <input type="checkbox" required />
                      Entendo que a exclusão não pode ser desfeita.
                    </label>
                    <Button variant="destructive" disabled={busy}>
                      Confirmar exclusão
                    </Button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
