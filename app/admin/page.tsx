import type { Metadata } from "next";
import AdminPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Administração",
};

export default function AdminPage() {
  return <AdminPageClient />;
}
