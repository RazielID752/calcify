export const billingDestination = (billing: { hasPremium: boolean }) =>
  billing.hasPremium ? null : "/assinatura?regularizar=1";

export function stripeRedirectUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname) ||
    url.username ||
    url.password
  ) {
    throw new Error("Endereço de pagamento inválido.");
  }
  return url.href;
}
export const statusLabel = (status: string) =>
  ({
    none: "Sem assinatura",
    trialing: "Em teste",
    active: "Ativa",
    past_due: "Pagamento pendente",
    unpaid: "Pagamento pendente",
    incomplete: "Pagamento incompleto",
    incomplete_expired: "Contratação expirada",
    canceled: "Encerrada",
    paused: "Pausada",
  })[status] ?? status;
export const paymentLabel = (status: string) =>
  ({
    paid: "Em dia",
    pending: "Pendente",
    not_applicable: "Não aplicável",
    ended: "Encerrada",
  })[status] ?? status;
export const billingDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

export function shouldRegularizeAutomatically(billing: {
  enabled: boolean;
  hasPremium: boolean;
  emailVerified: boolean;
  hasCpf: boolean;
  accessBlocked: boolean;
  status: string;
}) {
  return (
    billing.enabled &&
    !billing.hasPremium &&
    !billing.accessBlocked &&
    billing.emailVerified &&
    billing.hasCpf &&
    [
      "trialing",
      "active",
      "past_due",
      "unpaid",
      "paused",
      "canceled",
      "incomplete",
      "incomplete_expired",
    ].includes(billing.status)
  );
}
