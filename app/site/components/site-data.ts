import {
  BadgeCheck,
  Calculator,
  Cloud,
  Compass,
  FileText,
  GitBranch,
  Languages,
  Library,
  PencilRuler,
  Sparkles,
  WandSparkles,
} from "lucide-react";

export const featureHighlights = [
  {
    icon: Calculator,
    title: "Cálculos no meio do texto",
    description:
      "Escreva expressões como parte das suas anotações e veja o resultado aparecer sem sair do fluxo.",
  },
  {
    icon: Languages,
    title: "Conversões inteligentes",
    description:
      "Moedas e unidades entram no documento como linguagem natural, sem planilhas abertas ao lado.",
  },
  {
    icon: FileText,
    title: "Markdown que vira documento",
    description:
      "Cole, importe ou escreva markdown e transforme ideias soltas em uma página organizada.",
  },
  {
    icon: Library,
    title: "Biblioteca de documentos",
    description:
      "Abas mostram o que está aberto. A biblioteca guarda tudo que está salvo ou local.",
  },
];

export const workflowItems = [
  {
    icon: PencilRuler,
    title: "Escreva primeiro",
    description:
      "O editor fica limpo, rápido e direto para capturar pensamento sem fricção.",
  },
  {
    icon: WandSparkles,
    title: "O texto se organiza",
    description:
      "Títulos automáticos, markdown e atalhos reduzem microtarefas enquanto você escreve.",
  },
  {
    icon: Cloud,
    title: "Trabalhe no seu ritmo",
    description:
      "Escreva localmente, salve na nuvem e retome seus documentos quando precisar.",
  },
  {
    icon: GitBranch,
    title: "Leve adiante",
    description:
      "Exporte markdown, abra no GitHub e continue o trabalho onde fizer sentido.",
  },
];

export const trustItems = [
  "Cálculos e conversões dentro da própria nota",
  "Markdown para estruturar ideias sem montar páginas complexas",
  "Biblioteca simples para encontrar e reabrir documentos",
  "Exportação em Markdown para levar seu conteúdo adiante",
];

export const productPills = [
  { label: "Markdown", tone: "bg-zinc-950 text-white" },
  { label: "Cálculo", tone: "bg-emerald-100 text-emerald-950" },
  { label: "Conversão", tone: "bg-amber-100 text-amber-950" },
  { label: "Biblioteca", tone: "bg-rose-100 text-rose-950" },
];

export const heroStats = [
  { value: "1", label: "lugar para escrever e calcular" },
  { value: "4", label: "níveis de títulos para organizar" },
  { value: "MD", label: "entrada e saída em Markdown" },
];

export const navItems = [
  { label: "Recursos", href: "#recursos" },
  { label: "Fluxo", href: "#fluxo" },
  { label: "Produto", href: "#produto" },
  { label: "Plano", href: "#plano" },
  { label: "Download", href: "#download" },
  { label: "Por que Calcify", href: "#diferencial" },
];

export const whatsappContactUrl = "https://wa.me/+5521974131359?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Calcify!";

export const pricingPlan = {
  price: "23,99",
  cadence: "mensal",
  tagline: "Um plano unico, sem camadas escondidas.",
  ctaLabel: "Entre em contato",
  bullets: [
    "Acesso completo ao editor Calcify",
    "Calculos e conversoes dentro do texto",
    "Exportacao em Markdown e PDF",
    "Biblioteca e abas para organizar documentos",
    "Suporte direto com o time do produto",
  ],
};

export const pricingFeatures = [
  "Editor limpo com atalhos inteligentes",
  "Markdown que vira documento pronto",
  "Exportacao em Markdown e PDF",
  "Sincronizacao para continuar de onde parou",
  "Calculos no meio do texto para manter o raciocinio junto do numero",
  "Conversoes de moedas e unidades sem sair do editor",
];

export const productGridItems = [
  {
    icon: Sparkles,
    title: "Escreva como em uma nota. Resolva como em uma ferramenta.",
    description:
      "O Calcify mantém a página simples para capturar pensamento rápido, mas entrega comandos de editor quando a nota precisa virar algo mais organizado.",
    eyebrow: "Editor inteligente",
    preview: "Plano da semana\n- orçamento\n- decisões\n- próximos passos",
    className: "md:col-span-2",
  },
  {
    icon: Calculator,
    title: "Cálculo no ponto exato da decisão.",
    description:
      "Digite uma expressão no meio da nota e veja o resultado sem trocar para calculadora ou planilha. O contexto fica junto do número.",
    eyebrow: "Contas no texto",
    preview: "596.40 + 89.90 + 49.90\n= R$ 736,20",
  },
  {
    icon: Library,
    title: "Uma biblioteca para continuar rápido.",
    description:
      "Abas e documentos salvos ficam perto do editor, para você voltar ao que estava fazendo sem procurar arquivo.",
    eyebrow: "Documentos",
    preview: "Custos da semana\nPlanejamento\nIdeias do produto",
  },
  {
    icon: Cloud,
    title: "Local primeiro. Nuvem quando fizer sentido.",
    description:
      "Comece a escrever sem fricção e salve na nuvem quando o documento precisar acompanhar você.",
    eyebrow: "Sincronização",
    preview: "Rascunho local\nDocumento salvo\nPronto para retomar",
  },
  {
    icon: FileText,
    title: "Markdown entra, markdown sai.",
    description:
      "Isso importa quando a nota vira entrega. Você pode escrever no Calcify, organizar com títulos e listas, calcular custos ou estimativas e exportar em Markdown para documentação, GitHub, relatórios ou qualquer fluxo que aceite texto limpo.",
    eyebrow: "Markdown portátil",
    preview: "# Plano\n- custo\n- decisão",
    className: "md:col-span-2 lg:col-span-3",
  },
];

export const qualityItems = [
  {
    icon: Compass,
    title: "Menos arquitetura, mais pensamento",
    description:
      "Você não precisa montar um sistema de páginas antes de escrever. Abra, digite, calcule e siga.",
  },
  {
    icon: BadgeCheck,
    title: "Feito para notas que trabalham",
    description:
      "Bom para planejamento, orçamento, estudos, reuniões e qualquer texto que precisa chegar a um número.",
  },
];
