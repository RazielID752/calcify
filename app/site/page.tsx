import type { Metadata } from "next";
import FeaturesSection from "./components/features-section";
import HeroSection from "./components/hero-section";
import SiteCta from "./components/site-cta";
import SiteFooter from "./components/site-footer";
import SiteHeader from "./components/site-header";
import SyncSection from "./components/sync-section";
import WorkflowSection from "./components/workflow-section";

export const metadata: Metadata = {
  title: "Calcify | Editor inteligente para notas, cálculos e documentos",
  description:
    "Conheça o Calcify: um editor bonito e direto para escrever, calcular, converter moedas e organizar documentos locais e na nuvem.",
};

export default function SitePage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <SyncSection />
      <SiteCta />
      <SiteFooter />
    </main>
  );
}
