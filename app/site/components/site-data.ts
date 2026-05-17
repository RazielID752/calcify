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
    title: "Continue de onde parou",
    description:
      "Trabalhe localmente, salve na nuvem e abra seus documentos quando precisar retomar uma ideia.",
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
  { label: "Por que Calcify", href: "#diferencial" },
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
