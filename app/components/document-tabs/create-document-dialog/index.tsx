"use client";

import {
  BriefcaseBusiness,
  Calculator,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  type LucideIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type DocumentTitleFormValues,
  documentTitleDefaultValues,
  documentTitleFormSchema,
} from "@/app/forms/document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  title: string;
  accentClassName: string;
  previewItems: string[];
  previewSections: Array<{
    title: string;
    items: string[];
  }>;
  content: string;
};

type CreateDocumentDialogProps = {
  open: boolean;
  defaultDocumentTitle: string;
  onOpenChange: (open: boolean) => void;
  onCreateDocument: (title: string, content?: string) => void;
};

const createTemplateContent = (content: string) =>
  content.replace(/\n\s*/g, "");

const templates: Template[] = [
  {
    id: "template-executive-meeting",
    name: "Reunião executiva",
    category: "Equipe",
    description: "Pauta, decisões, riscos, responsáveis e próximos passos.",
    icon: Calendar,
    title: "Reunião executiva",
    accentClassName: "from-emerald-500 via-teal-400 to-sky-500",
    previewItems: ["Pauta objetiva", "Decisões rastreáveis", "Plano de ação"],
    previewSections: [
      {
        title: "Abertura",
        items: ["Objetivo da reunião", "Critério de sucesso", "Participantes"],
      },
      {
        title: "Decisões",
        items: ["Tema", "Decisão tomada", "Impacto esperado", "Responsável"],
      },
      {
        title: "Execução",
        items: ["Plano de ação", "Prazos", "Riscos", "Próxima reunião"],
      },
    ],
    content: createTemplateContent(`
      <h1>Reunião executiva</h1>
      <p><strong>Data:</strong> </p>
      <p><strong>Horário:</strong> </p>
      <p><strong>Facilitador:</strong> </p>
      <p><strong>Participantes:</strong> </p>
      <p><strong>Objetivo principal:</strong> alinhar decisões, remover bloqueios e definir próximos passos.</p>
      <h2>Resumo executivo</h2>
      <p>Em poucas linhas, registre o que foi decidido, o impacto esperado e o que precisa acontecer até a próxima reunião.</p>
      <h2>Pauta</h2>
      <ol>
        <li>Status dos indicadores principais.</li>
        <li>Decisões pendentes.</li>
        <li>Bloqueios que precisam de apoio.</li>
        <li>Próximos marcos do projeto.</li>
      </ol>
      <h2>Indicadores analisados</h2>
      <ul>
        <li><strong>Indicador:</strong> Receita | <strong>Atual:</strong>  | <strong>Meta:</strong>  | <strong>Status:</strong> </li>
        <li><strong>Indicador:</strong> Entregas | <strong>Atual:</strong>  | <strong>Meta:</strong>  | <strong>Status:</strong> </li>
        <li><strong>Indicador:</strong> Pendências críticas | <strong>Atual:</strong>  | <strong>Meta:</strong>  | <strong>Status:</strong> </li>
      </ul>
      <h2>Decisões tomadas</h2>
      <ul>
        <li><strong>Tema:</strong>  | <strong>Decisão:</strong>  | <strong>Motivo:</strong>  | <strong>Impacto:</strong> </li>
        <li><strong>Tema:</strong>  | <strong>Decisão:</strong>  | <strong>Motivo:</strong>  | <strong>Impacto:</strong> </li>
      </ul>
      <h2>Plano de ação</h2>
      <ul>
        <li><strong>Ação:</strong>  | <strong>Responsável:</strong>  | <strong>Prazo:</strong>  | <strong>Status:</strong> Não iniciado</li>
        <li><strong>Ação:</strong>  | <strong>Responsável:</strong>  | <strong>Prazo:</strong>  | <strong>Status:</strong> Não iniciado</li>
      </ul>
      <h2>Riscos e bloqueios</h2>
      <ul>
        <li><strong>Risco:</strong>  | <strong>Probabilidade:</strong>  | <strong>Impacto:</strong>  | <strong>Mitigação:</strong> </li>
      </ul>
      <h2>Próxima reunião</h2>
      <p><strong>Data sugerida:</strong> </p>
      <p><strong>Assuntos que devem voltar:</strong> </p>
    `),
  },
  {
    id: "template-budget-proposal",
    name: "Orçamento comercial",
    category: "Financeiro",
    description:
      "Modelo para proposta comercial com escopo, prazo e investimento.",
    icon: Calculator,
    title: "Orçamento comercial",
    accentClassName: "from-amber-400 via-orange-400 to-rose-500",
    previewItems: ["Escopo técnico", "Fora do escopo", "Investimento"],
    previewSections: [
      {
        title: "Projeto",
        items: ["Resumo", "Funcionalidades previstas", "Controle de acesso"],
      },
      {
        title: "Escopo",
        items: [
          "Página administrativa",
          "Contas individuais",
          "Grupos profissionais",
        ],
      },
      {
        title: "Comercial",
        items: ["Prazo de entrega", "Investimento", "Forma de pagamento"],
      },
    ],
    content: createTemplateContent(`
      <h1>Orçamento - Desenvolvimento de Funcionalidade Administrativa</h1>
      <p>Orçamento - Desenvolvimento de Funcionalidade Administrativa</p>
      <h2>1. Resumo do Projeto</h2>
      <p>Desenvolvimento de uma página administrativa, acessível apenas para usuários com perfil de administrador, com o objetivo de gerenciar contas, grupos profissionais e controle de acesso ao sistema.</p>
      <p>Essa funcionalidade será utilizada para permitir o cadastro e gerenciamento de clientes, tanto de forma individual quanto em grupos, facilitando o controle manual de acesso ao serviço.</p>
      <hr>
      <h2>2. Funcionalidades Previstas</h2>
      <h3>2.1. Página Administrativa</h3>
      <p>Criação de uma área exclusiva para administradores, onde será possível:</p>
      <ul>
        <li>Visualizar todas as contas cadastradas;</li>
        <li>Criar novas contas;</li>
        <li>Editar informações das contas;</li>
        <li>Ativar ou desativar contas individualmente;</li>
        <li>Visualizar o status de acesso de cada conta;</li>
        <li>Identificar se a conta pertence ou não a um grupo profissional.</li>
      </ul>
      <hr>
      <h3>2.2. Gerenciamento de Contas Individuais</h3>
      <p>O sistema deverá permitir que existam contas sem vínculo com nenhum grupo profissional.</p>
      <p>Essas contas poderão ser gerenciadas individualmente pelo administrador, incluindo ativação, desativação e edição de informações.</p>
      <hr>
      <h3>2.3. Gerenciamento de Grupos Profissionais</h3>
      <blockquote>
        <p><strong>Exemplo:</strong></p>
        <p>Um grupo profissional possui 10 contas vinculadas.</p>
        <p>Caso o administrador desative esse grupo, todas as 10 contas perderão o acesso ao sistema.</p>
      </blockquote>
      <h3>2.4. Controle Manual de Acesso</h3>
      <p>Como o serviço será vendido inicialmente sem integração com gateway de pagamento, o controle de acesso será feito manualmente pelo administrador.</p>
      <p>Caso o cliente não realize o pagamento até a data combinada, o administrador poderá:</p>
      <ol>
        <li>Desativar uma conta individual;</li>
        <li>Desativar um grupo inteiro;</li>
        <li>Reativar o acesso após regularização do pagamento.</li>
      </ol>
      <hr>
      <h2>3. Escopo Técnico</h2>
      <p>O desenvolvimento contempla:</p>
      <ul>
        <li>Criação da página administrativa;</li>
        <li>Criação da interface de listagem de contas;</li>
        <li>Criação da interface de cadastro e edição de contas;</li>
        <li>Criação da interface de cadastro e edição de grupos profissionais;</li>
        <li>Regra para contas individuais sem grupo;</li>
        <li>Regra para contas vinculadas a grupos;</li>
        <li>Controle de ativação e desativação de contas;</li>
        <li>Controle de ativação e desativação de grupos;</li>
        <li>Validações básicas de formulário;</li>
        <li>Integração com a API, caso já exista endpoint disponível;</li>
        <li>Ajustes visuais seguindo o padrão atual do sistema.</li>
      </ul>
      <hr>
      <h2>4. Fora do Escopo</h2>
      <p>Este orçamento não contempla, neste momento:</p>
      <ul>
        <li>Integração com gateway de pagamento;</li>
        <li>Emissão automática de cobrança;</li>
        <li>Envio automático de notificações por e-mail ou WhatsApp;</li>
        <li>Área financeira completa;</li>
        <li>Relatórios avançados;</li>
        <li>Sistema de assinatura recorrente automático.</li>
      </ul>
      <p>Essas funcionalidades poderão ser orçadas separadamente em uma próxima etapa.</p>
      <hr>
      <h2>5. Prazo de Entrega</h2>
      <p>O prazo estimado para desenvolvimento é de:</p>
      <p><strong>X dias úteis</strong></p>
      <p>Esse prazo pode variar conforme disponibilidade da API, ajustes solicitados e validações durante o desenvolvimento.</p>
      <hr>
      <h2>6. Investimento</h2>
      <p>O valor para desenvolvimento da funcionalidade descrita neste orçamento é de:</p>
      <h2><strong>R$ X.XXX,XX</strong></h2>
      <p>Forma de pagamento:</p>
      <ol>
        <li>50% para início do projeto;</li>
        <li>50% na entrega final da funcionalidade.</li>
      </ol>
      <hr>
      <h2>7. Observações</h2>
      <ul>
        <li>Qualquer alteração significativa no escopo descrito neste orçamento poderá gerar ajuste no prazo e no valor final.</li>
        <li>Após a aprovação, o desenvolvimento será iniciado conforme alinhamento entre as partes.</li>
      </ul>
    `),
  },
  {
    id: "template-project-plan",
    name: "Plano de projeto",
    category: "Gestão",
    description: "Objetivo, escopo, entregas, cronograma, riscos e métricas.",
    icon: FolderKanban,
    title: "Plano de projeto",
    accentClassName: "from-violet-500 via-indigo-500 to-sky-500",
    previewItems: ["Cronograma", "Riscos", "Métricas"],
    previewSections: [
      {
        title: "Estratégia",
        items: ["Objetivo", "Contexto", "Não objetivos"],
      },
      {
        title: "Execução",
        items: ["Entregas", "Cronograma por fase", "Responsáveis"],
      },
      {
        title: "Controle",
        items: ["Riscos", "Dependências", "Métricas de sucesso"],
      },
    ],
    content: createTemplateContent(`
      <h1>Plano de projeto</h1>
      <p><strong>Nome do projeto:</strong> </p>
      <p><strong>Dono do projeto:</strong> </p>
      <p><strong>Equipe envolvida:</strong> </p>
      <p><strong>Início previsto:</strong> </p>
      <p><strong>Entrega prevista:</strong> </p>
      <h2>Objetivo</h2>
      <p>Explique qual resultado precisa existir ao final do projeto e como ele será percebido pelo usuário ou cliente.</p>
      <h2>Contexto</h2>
      <p>Descreva por que este projeto importa agora, quais problemas ele resolve e quais oportunidades ele abre.</p>
      <h2>Escopo</h2>
      <h3>Inclui</h3>
      <ul>
        <li>Entrega principal do projeto.</li>
        <li>Documentação mínima para continuidade.</li>
        <li>Revisão com stakeholders.</li>
      </ul>
      <h3>Não inclui</h3>
      <ul>
        <li>Demandas fora do objetivo aprovado.</li>
        <li>Integrações não mapeadas.</li>
        <li>Manutenção contínua após encerramento.</li>
      </ul>
      <h2>Entregas</h2>
      <ul>
        <li><strong>Entrega 1:</strong> Descoberta e requisitos | <strong>Responsável:</strong>  | <strong>Prazo:</strong> </li>
        <li><strong>Entrega 2:</strong> Protótipo ou primeira versão | <strong>Responsável:</strong>  | <strong>Prazo:</strong> </li>
        <li><strong>Entrega 3:</strong> Versão final aprovada | <strong>Responsável:</strong>  | <strong>Prazo:</strong> </li>
      </ul>
      <h2>Cronograma</h2>
      <ul>
        <li><strong>Semana 1:</strong> alinhamento, requisitos e definição de sucesso.</li>
        <li><strong>Semana 2:</strong> produção da primeira versão.</li>
        <li><strong>Semana 3:</strong> revisão, ajustes e validação.</li>
        <li><strong>Semana 4:</strong> entrega final e documentação.</li>
      </ul>
      <h2>Dependências</h2>
      <ul>
        <li>Acesso a ferramentas, arquivos ou ambientes necessários.</li>
        <li>Aprovação do responsável dentro do prazo combinado.</li>
        <li>Disponibilidade da equipe para validações.</li>
      </ul>
      <h2>Riscos</h2>
      <ul>
        <li><strong>Risco:</strong> atraso em aprovações | <strong>Impacto:</strong> médio | <strong>Mitigação:</strong> checkpoints curtos.</li>
        <li><strong>Risco:</strong> mudança de escopo | <strong>Impacto:</strong> alto | <strong>Mitigação:</strong> registrar novas demandas separadamente.</li>
      </ul>
      <h2>Métricas de sucesso</h2>
      <ul>
        <li>Entrega aprovada dentro do prazo.</li>
        <li>Redução de retrabalho após validação.</li>
        <li>Satisfação do cliente ou usuário final.</li>
      </ul>
      <h2>Status semanal</h2>
      <p><strong>Progresso:</strong> 0%</p>
      <p><strong>Próxima ação crítica:</strong> </p>
    `),
  },
  {
    id: "template-study-notes",
    name: "Resumo de estudo",
    category: "Educação",
    description: "Conceitos, exemplos, dúvidas, flashcards e revisão final.",
    icon: GraduationCap,
    title: "Resumo de estudo",
    accentClassName: "from-cyan-500 via-emerald-400 to-lime-400",
    previewItems: ["Conceitos", "Flashcards", "Revisão"],
    previewSections: [
      {
        title: "Aprendizado",
        items: ["Ideia central", "Mapa de conceitos", "Exemplos práticos"],
      },
      {
        title: "Fixação",
        items: ["Perguntas", "Flashcards", "Erros comuns"],
      },
      {
        title: "Revisão",
        items: ["Resumo final", "Plano de revisão", "Checklist"],
      },
    ],
    content: createTemplateContent(`
      <h1>Resumo de estudo</h1>
      <p><strong>Tema:</strong> </p>
      <p><strong>Fonte/aula:</strong> </p>
      <p><strong>Data:</strong> </p>
      <p><strong>Objetivo da sessão:</strong> entender os conceitos principais e sair com pontos claros para revisão.</p>
      <h2>Ideia central</h2>
      <p>Explique o assunto em uma frase simples, como se estivesse ensinando para alguém que nunca viu o tema.</p>
      <h2>Mapa de conceitos</h2>
      <ul>
        <li><strong>Conceito principal:</strong>  | <strong>Definição:</strong>  | <strong>Por que importa:</strong> </li>
        <li><strong>Conceito relacionado:</strong>  | <strong>Definição:</strong>  | <strong>Ligação com o tema:</strong> </li>
        <li><strong>Termo importante:</strong>  | <strong>Significado:</strong>  | <strong>Exemplo:</strong> </li>
      </ul>
      <h2>Explicação passo a passo</h2>
      <ol>
        <li>Primeiro, entenda o problema que o conceito resolve.</li>
        <li>Depois, observe quais regras ou princípios sustentam o tema.</li>
        <li>Por fim, aplique em um exemplo real para fixar.</li>
      </ol>
      <h2>Exemplos práticos</h2>
      <ul>
        <li><strong>Exemplo 1:</strong> situação simples + explicação do resultado.</li>
        <li><strong>Exemplo 2:</strong> situação mais complexa + observação importante.</li>
      </ul>
      <h2>Dúvidas abertas</h2>
      <ul>
        <li>O que ainda não ficou claro?</li>
        <li>Qual parte preciso revisar com mais calma?</li>
        <li>Que pergunta eu faria ao professor ou especialista?</li>
      </ul>
      <h2>Erros comuns</h2>
      <ul>
        <li>Confundir o conceito com outro parecido.</li>
        <li>Decorar a definição sem entender aplicação.</li>
        <li>Ignorar exceções ou limitações.</li>
      </ul>
      <h2>Flashcards</h2>
      <ul>
        <li><strong>Pergunta:</strong> Qual é a ideia central? | <strong>Resposta:</strong> </li>
        <li><strong>Pergunta:</strong> Quando esse conceito é usado? | <strong>Resposta:</strong> </li>
        <li><strong>Pergunta:</strong> Qual erro devo evitar? | <strong>Resposta:</strong> </li>
      </ul>
      <h2>Revisão final</h2>
      <p><strong>Resumo em 3 linhas:</strong></p>
      <p>1. </p>
      <p>2. </p>
      <p>3. </p>
      <h2>Plano de revisão</h2>
      <ul>
        <li>[ ] Revisar em 24 horas.</li>
        <li>[ ] Resolver um exercício ou aplicar em um exemplo.</li>
        <li>[ ] Revisar novamente em 7 dias.</li>
      </ul>
    `),
  },
  {
    id: "template-weekly-plan",
    name: "Planejamento semanal",
    category: "Produtividade",
    description: "Prioridades, agenda, tarefas por dia e fechamento semanal.",
    icon: ClipboardList,
    title: "Planejamento semanal",
    accentClassName: "from-fuchsia-500 via-rose-400 to-amber-300",
    previewItems: ["Prioridades", "Agenda", "Fechamento"],
    previewSections: [
      {
        title: "Prioridades",
        items: ["Foco da semana", "Resultado esperado", "Não fazer"],
      },
      {
        title: "Rotina",
        items: ["Agenda diária", "Blocos de foco", "Tarefas rápidas"],
      },
      {
        title: "Números",
        items: ["Meta calculável", "Progresso", "Fechamento semanal"],
      },
    ],
    content: createTemplateContent(`
      <h1>Planejamento semanal</h1>
      <p><strong>Semana:</strong> </p>
      <p><strong>Área principal:</strong> trabalho / estudo / financeiro / pessoal</p>
      <h2>Intenção da semana</h2>
      <p>Descreva qual sensação ou resultado você quer ter ao terminar esta semana.</p>
      <h2>Prioridades</h2>
      <ol>
        <li><strong>Prioridade principal:</strong>  | <strong>Resultado esperado:</strong> </li>
        <li><strong>Prioridade secundária:</strong>  | <strong>Resultado esperado:</strong> </li>
        <li><strong>Prioridade de manutenção:</strong>  | <strong>Resultado esperado:</strong> </li>
      </ol>
      <h2>Não fazer esta semana</h2>
      <ul>
        <li>Evitar tarefas que não movem as prioridades.</li>
        <li>Não aceitar novas demandas sem revisar impacto no cronograma.</li>
        <li>Não deixar decisões importantes para sexta-feira.</li>
      </ul>
      <h2>Agenda por dia</h2>
      <ul>
        <li><strong>Segunda:</strong> planejamento, prioridade 1 e alinhamentos.</li>
        <li><strong>Terça:</strong> bloco de foco profundo e produção.</li>
        <li><strong>Quarta:</strong> revisão de progresso e ajustes.</li>
        <li><strong>Quinta:</strong> finalização das entregas principais.</li>
        <li><strong>Sexta:</strong> fechamento, pendências e preparação da próxima semana.</li>
      </ul>
      <h2>Blocos de foco</h2>
      <ul>
        <li><strong>Bloco 1:</strong>  | <strong>Duração:</strong> 90 min | <strong>Entrega:</strong> </li>
        <li><strong>Bloco 2:</strong>  | <strong>Duração:</strong> 60 min | <strong>Entrega:</strong> </li>
        <li><strong>Bloco 3:</strong>  | <strong>Duração:</strong> 45 min | <strong>Entrega:</strong> </li>
      </ul>
      <h2>Tarefas rápidas</h2>
      <ul>
        <li>[ ] Responder pendências importantes.</li>
        <li>[ ] Organizar documentos ou arquivos usados na semana.</li>
        <li>[ ] Confirmar agenda e próximos compromissos.</li>
        <li>[ ] Registrar aprendizados e decisões.</li>
      </ul>
      <h2>Números da semana</h2>
      <p>Meta financeira: 1000 * 1 =</p>
      <p>Progresso esperado até quarta: 1000 * 50% =</p>
      <p>Horas de foco planejadas: 2 + 1.5 + 1.5 + 2 =</p>
      <h2>Fechamento</h2>
      <p><strong>O que funcionou?</strong> </p>
      <p><strong>O que ficou travado?</strong> </p>
      <p><strong>O que ajustar na próxima semana?</strong> </p>
      <p><strong>Nota da semana:</strong> /10</p>
    `),
  },
  {
    id: "template-briefing",
    name: "Briefing criativo",
    category: "Criação",
    description: "Objetivo, público, tom, referências, entregas e critérios.",
    icon: BriefcaseBusiness,
    title: "Briefing criativo",
    accentClassName: "from-sky-500 via-blue-500 to-violet-500",
    previewItems: ["Público", "Tom", "Entregas"],
    previewSections: [
      {
        title: "Direção",
        items: ["Objetivo", "Mensagem central", "Contexto da marca"],
      },
      {
        title: "Criação",
        items: ["Público", "Tom", "Referências", "Restrições"],
      },
      {
        title: "Entrega",
        items: ["Formatos", "Critérios de aprovação", "Checklist final"],
      },
    ],
    content: createTemplateContent(`
      <h1>Briefing criativo</h1>
      <p><strong>Cliente/projeto:</strong> </p>
      <p><strong>Responsável:</strong> </p>
      <p><strong>Data:</strong> </p>
      <p><strong>Prazo desejado:</strong> </p>
      <h2>Contexto</h2>
      <p>Explique o momento da marca, produto ou campanha. O que está acontecendo agora e por que essa criação é necessária?</p>
      <h2>Objetivo</h2>
      <p>O que essa peça, campanha ou projeto precisa provocar? Exemplo: gerar interesse, explicar uma oferta, vender, educar ou melhorar percepção da marca.</p>
      <h2>Mensagem central</h2>
      <p>Se a pessoa lembrar de apenas uma coisa depois de ver a peça, ela deve lembrar que: </p>
      <h2>Público-alvo</h2>
      <ul>
        <li><strong>Quem é:</strong> </li>
        <li><strong>Dor principal:</strong> </li>
        <li><strong>Desejo principal:</strong> </li>
        <li><strong>Objeções:</strong> </li>
        <li><strong>Linguagem que combina:</strong> </li>
      </ul>
      <h2>Tom e estilo</h2>
      <ul>
        <li><strong>Tom desejado:</strong> direto / sofisticado / leve / técnico / emocional</li>
        <li><strong>Evitar:</strong> </li>
        <li><strong>Palavras importantes:</strong> </li>
        <li><strong>Palavras proibidas:</strong> </li>
      </ul>
      <h2>Referências</h2>
      <ul>
        <li><strong>Referência 1:</strong>  | <strong>O que aproveitar:</strong> </li>
        <li><strong>Referência 2:</strong>  | <strong>O que evitar:</strong> </li>
      </ul>
      <h2>Entregas</h2>
      <ul>
        <li><strong>Formato:</strong> post feed | <strong>Quantidade:</strong>  | <strong>Prazo:</strong> </li>
        <li><strong>Formato:</strong> story | <strong>Quantidade:</strong>  | <strong>Prazo:</strong> </li>
        <li><strong>Formato:</strong> apresentação | <strong>Quantidade:</strong>  | <strong>Prazo:</strong> </li>
      </ul>
      <h2>Critérios de aprovação</h2>
      <ul>
        <li>A mensagem principal está clara em poucos segundos.</li>
        <li>O visual combina com o posicionamento da marca.</li>
        <li>A peça orienta a próxima ação do público.</li>
        <li>O conteúdo respeita restrições e requisitos informados.</li>
      </ul>
      <h2>Checklist final</h2>
      <ul>
        <li>[ ] Ortografia revisada.</li>
        <li>[ ] Links, preços e informações conferidos.</li>
        <li>[ ] Arquivos finais exportados nos formatos corretos.</li>
        <li>[ ] Aprovação registrada.</li>
      </ul>
    `),
  },
];

export default function CreateDocumentDialog({
  open,
  defaultDocumentTitle,
  onOpenChange,
  onCreateDocument,
}: CreateDocumentDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates[0]?.id ?? "",
  );
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentTitleFormValues>({
    defaultValues: documentTitleDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(documentTitleDefaultValues);
      setSelectedTemplateId(templates[0]?.id ?? "");
    }
  }, [open, reset]);

  const handleCreateBlankDocument = handleSubmit((values) => {
    onCreateDocument(values.title);
    reset(documentTitleDefaultValues);
  });

  const handleCreateTemplateDocument = (template: Template) => {
    onCreateDocument(template.title, template.content);
    reset(documentTitleDefaultValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100svh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="size-4.5" />
            </div>

            <div className="space-y-1">
              <DialogTitle>Criar novo documento</DialogTitle>
              <DialogDescription>
                Comece em branco ou escolha um modelo pronto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-4 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    Criar documento em branco
                  </p>
                  <p className="text-xs text-zinc-600">
                    Uma página limpa para começar do zero.
                  </p>
                </div>
              </div>

              <form
                id="create-document-form"
                className="space-y-2"
                onSubmit={handleCreateBlankDocument}
              >
                <label
                  htmlFor="create-document-name"
                  className="mb-3 text-xs font-medium text-zinc-600"
                >
                  Nome do documento (opcional)
                </label>

                <div className="relative pt-2">
                  <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="create-document-name"
                    placeholder={defaultDocumentTitle}
                    aria-label="Nome do novo documento"
                    className="h-9 bg-white pl-9"
                    aria-invalid={errors.title ? "true" : "false"}
                    {...register("title", documentTitleFormSchema.title)}
                  />
                </div>

                {errors.title ? (
                  <p className="text-xs text-red-600">{errors.title.message}</p>
                ) : null}
              </form>

              <Button
                type="submit"
                form="create-document-form"
                variant="outline"
                className="h-9 w-full justify-center border-emerald-300 bg-emerald-100/70 text-emerald-900 hover:bg-emerald-100"
              >
                <Plus className="size-4" />
                Criar documento em branco
              </Button>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Galeria de modelos
                  </p>
                  <p className="text-xs text-zinc-500">
                    Estruturas prontas para acelerar seu trabalho.
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {templates.length} modelos
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((template) => {
                  const TemplateIcon = template.icon;
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={`group overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md ${
                        isSelected
                          ? "border-emerald-300 ring-2 ring-emerald-100"
                          : "border-zinc-200"
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div
                        className={`h-2 bg-gradient-to-r ${template.accentClassName}`}
                      />
                      <div className="p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                              <TemplateIcon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900">
                                {template.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {template.category}
                              </p>
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-xs leading-5 text-zinc-600">
                          {template.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {template.previewItems.slice(0, 2).map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="min-h-0 border-zinc-200 border-t bg-zinc-50/80 p-4 sm:p-6 lg:border-t-0 lg:border-l">
            {selectedTemplate ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                      Pré-visualização
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-zinc-950">
                      {selectedTemplate.name}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white ${selectedTemplate.accentClassName}`}
                  >
                    <selectedTemplate.icon className="size-5" />
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedTemplate.previewItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                  <div
                    className={`h-2 bg-gradient-to-r ${selectedTemplate.accentClassName}`}
                  />
                  <div className="max-h-92 overflow-y-auto px-5 py-5">
                    <h4 className="text-2xl font-semibold text-zinc-950">
                      {selectedTemplate.title}
                    </h4>
                    <div className="mt-5 space-y-5">
                      {selectedTemplate.previewSections.map((section) => (
                        <section key={section.title}>
                          <h5 className="text-sm font-semibold text-zinc-900">
                            {section.title}
                          </h5>
                          <ul className="mt-2 space-y-1.5 text-sm text-zinc-600">
                            {section.items.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  className="mt-4 h-10 w-full"
                  onClick={() => handleCreateTemplateDocument(selectedTemplate)}
                >
                  <Plus className="size-4" />
                  Usar este modelo
                </Button>
              </div>
            ) : null}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
