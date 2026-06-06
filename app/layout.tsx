import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CookieConsentBanner from "@/app/components/cookie-consent-banner";
import Toaster from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://calcify.app"),
  authors: [{ name: "Marcos Nathanael" }],
  creator: "Marcos Nathanael",
  publisher: "Calcify",
  title: {
    default: "Calcify",
    template: "%s | Calcify",
  },
  description:
    "O bloco de notas que pensa por você: cálculos automáticos, conversões de moedas e organização inteligente em tempo real.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Calcify",
    description:
      "Escreva notas, faça cálculos automáticos, converta moedas e organize documentos em um editor limpo e inteligente.",
    url: "https://www.calcify.com.br",
    siteName: "Calcify",
     images: [
      {
        url: "https://www.calcify.com.br/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Calcify - O bloco de notas inteligente para cálculos automáticos e organização eficiente.",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calcify",
    description:
      "O bloco de notas que pensa por você: cálculos automáticos, conversões e organização inteligente em tempo real.",
      images: ["https://www.calcify.com.br/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsentBanner />
        <Toaster />
      </body>
    </html>
  );
}
