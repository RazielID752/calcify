import {
  BadgeCheck,
  Calculator,
  Cloud,
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
    title: "Salve local e na nuvem",
    description:
      "O documento mantém identidade local, versão de servidor e proteção contra conflitos.",
  },
  {
    icon: GitBranch,
    title: "Leve adiante",
    description:
      "Exporte markdown, abra no GitHub e continue o trabalho onde fizer sentido.",
  },
];

export const trustItems = [
  "Autosave com versão conhecida do servidor",
  "Criação idempotente para evitar duplicatas",
  "Exclusão somente pela biblioteca",
  "Documentos locais preservados quando a nuvem muda",
];

export const productPills = [
  { label: "Markdown", tone: "bg-zinc-950 text-white" },
  { label: "Cálculo", tone: "bg-emerald-100 text-emerald-950" },
  { label: "Conversão", tone: "bg-amber-100 text-amber-950" },
  { label: "Biblioteca", tone: "bg-rose-100 text-rose-950" },
];

export const heroStats = [
  { value: "1.5s", label: "autosave após edição" },
  { value: "10", label: "documentos por página" },
  { value: "0", label: "duplicatas em retry" },
];

export const navItems = [
  { label: "Recursos", href: "#recursos" },
  { label: "Fluxo", href: "#fluxo" },
  { label: "Sync", href: "#sync" },
];

export const qualityItems = [
  {
    icon: Sparkles,
    title: "Interface limpa",
    description:
      "A página principal parece um caderno moderno, mas com ferramentas de produção por perto.",
  },
  {
    icon: BadgeCheck,
    title: "Contrato claro",
    description:
      "Local, nuvem, versão e biblioteca agora têm papéis diferentes e previsíveis.",
  },
];
