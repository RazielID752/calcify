import type { Metadata } from "next";
import DesktopDownloadSection from "./components/desktop-download-section";
import FeaturesSection from "./components/features-section";
import HeroSection from "./components/hero-section";
import ProductGridSection from "./components/product-grid-section";
import SiteCta from "./components/site-cta";
import SiteFooter from "./components/site-footer";
import SiteHeader from "./components/site-header";
import SyncSection from "./components/sync-section";
import WorkflowSection from "./components/workflow-section";

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
      <SyncSection />
      <DesktopDownloadSection />
      <SiteCta />
      <SiteFooter />
    </main>
  );
}
