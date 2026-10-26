import { stripeRedirectUrl } from "@/lib/billing-state";
import { apiClient } from "@/utils/api-client";
import { AUTH_TOKEN_STORAGE_KEY } from "@/utils/auth-session";
export type BillingSummary = {
  userId: string;
  name: string;
  email: string;
  profile: string;
  enabled: boolean;
  hasPremium: boolean;
  accessBlocked: boolean;
  status: string;
  paymentStatus: string;
  emailVerified: boolean;
  hasCpf: boolean;
  trialEligible: boolean;
  trialEndsAt: string | null;
  paidThrough: string | null;
  nextPaymentAt: string | null;
  cancelAtPeriodEnd: boolean;
  endsAt: string | null;
  grantUntil: string | null;
  grantReason: string | null;
  syncedAt: string | null;
  deletionPending: boolean;
  hasCustomer: boolean;
  stripeCustomerUrl: string | null;
  amount: number;
  currency: string;
  interval: string;
};
export const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? ""}`,
  },
});
export async function getBilling(sync = false) {
  const response = sync
    ? await apiClient.post<BillingSummary>(
        "/api/billing/sync",
        {},
        authConfig(),
      )
    : await apiClient.get<BillingSummary>("/api/billing/me", authConfig());
  return response.data;
}
export async function openStripe(kind: "checkout" | "portal") {
  const { data } = await apiClient.post<{ url: string }>(
    `/api/billing/${kind}`,
    {},
    authConfig(),
  );
  window.location.assign(stripeRedirectUrl(data.url));
}
