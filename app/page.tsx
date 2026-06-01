import type { Metadata } from "next";
import DesktopDownloadSection from "./site/components/desktop-download-section";
import FeaturesSection from "./site/components/features-section";
import HeroSection from "./site/components/hero-section";
import ProductGridSection from "./site/components/product-grid-section";
import PricingSection from "./site/components/pricing-section";
import SiteCta from "./site/components/site-cta";
import SiteFooter from "./site/components/site-footer";
import SiteHeader from "./site/components/site-header";
import SyncSection from "./site/components/sync-section";
import WorkflowSection from "./site/components/workflow-section";

export const metadata: Metadata = {
  title: "Calcify | Notas que calculam enquanto você escreve",
  description:
    "Conheça o Calcify: um editor limpo para escrever, calcular, converter moedas, organizar documentos e exportar em Markdown sem sair da nota.",
};

export default function SitePage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <HeroSection />
      <FeaturesSection />
      <ProductGridSection />
      <WorkflowSection />
      <PricingSection />
      <SyncSection />
      <DesktopDownloadSection />
      <SiteCta />
      <SiteFooter />
    </main>
  );
}
