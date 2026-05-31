import type { Metadata } from "next";
import LoginPageClient from "../site/components/login-page-client";

export const metadata: Metadata = {
  title: "Login | Calcify",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
