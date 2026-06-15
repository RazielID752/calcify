import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site/components/site-footer";
import SiteHeader from "../site/components/site-header";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Entenda como o Calcify trata dados pessoais, cookies, documentos, planos pagos e informações de acesso.",
};

const sections = [
  {
    title: "A) Aviso prévio",
    content: [
      "Esta Política de Privacidade explica, de forma objetiva, quais dados podem ser tratados pelo Calcify, para quais finalidades, por quanto tempo podem ser mantidos e como o usuário pode solicitar acesso, correção ou exclusão.",
      "Ao acessar o site, criar uma conta, utilizar o editor, compartilhar documentos ou contratar um plano pago, o usuário declara estar ciente das condições desta política.",
      "Esta política foi elaborada em atenção à Lei Federal n. 12.965/2014 (Marco Civil da Internet) e à Lei Federal n. 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD), podendo ser atualizada a qualquer momento mediante publicação nesta página.",
    ],
  },
  {
    title: "B) Dados pessoais tratados",
    content: [
      "Podemos tratar dados informados ativamente pelo usuário, como nome, e-mail, senha criptografada, dados de conta, preferências de acesso, permissões de compartilhamento e mensagens enviadas em canais de atendimento.",
      "Também podemos tratar dados técnicos gerados pelo uso do serviço, como endereço IP, data e hora de acesso, identificadores de sessão, tipo de navegador, dispositivo utilizado, registros de autenticação e eventos necessários para segurança e funcionamento do produto.",
      "As senhas não são armazenadas em texto puro. Quando uma senha temporária é gerada pelo administrador, ela deve ser trocada pelo usuário para uma senha definitiva.",
    ],
  },
  {
    title: "C) Documentos, notas e colaboração",
    content: [
      "O Calcify permite criar, editar, salvar, exportar e compartilhar documentos. O conteúdo criado pelo usuário pode incluir textos, cálculos, valores financeiros, informações profissionais ou outros dados inseridos voluntariamente.",
      "Quando o usuário compartilha um documento, o sistema pode registrar e exibir dados como e-mail da pessoa convidada, tipo de permissão, proprietário do arquivo e configurações de acesso público ou privado.",
      "O usuário é responsável por não inserir dados sensíveis, sigilosos ou de terceiros sem autorização adequada. O Calcify adota medidas para proteger os dados, mas o conteúdo dos documentos deve ser tratado pelo próprio usuário com responsabilidade.",
    ],
  },
  {
    title: "D) Plano pago, cobrança e controle de acesso",
    content: [
      "O Calcify pode oferecer plano pago com acesso mediante pagamento direto, sem integração inicial com gateway de pagamento. Nesses casos, o controle de ativação, renovação ou suspensão pode ser feito manualmente pela administração do serviço.",
      "Para fins de gestão do plano, poderemos tratar dados como nome, e-mail, status da conta, grupo profissional vinculado, data de contratação, situação de pagamento, histórico de suporte e informações necessárias para liberação ou bloqueio de acesso.",
      "Caso o pagamento não seja realizado até a data combinada, a conta individual ou o grupo profissional correspondente poderá ser desativado. A desativação impede o acesso ao sistema enquanto a situação não for regularizada.",
      "Se uma conta estiver vinculada a um grupo profissional, ela poderá seguir as regras de acesso aplicadas ao grupo. Assim, a desativação do grupo pode suspender o acesso de todas as contas associadas.",
    ],
  },
  {
    title: "E) Cookies",
    content: [
      "Cookies são pequenos arquivos armazenados no navegador para lembrar informações de navegação e permitir uma experiência adequada.",
      "O Calcify utiliza cookies e armazenamento local para manter sessão de autenticação, preferências do usuário, aceite da barra de cookies e funcionamento básico da aplicação.",
      "Também poderemos utilizar dados agregados ou ferramentas analíticas para entender fluxo de visitas, desempenho do site e melhorias de produto. Quando aplicável, cookies não essenciais dependerão de consentimento ou poderão ser gerenciados pelo navegador.",
      "O usuário pode apagar cookies e dados locais nas configurações do navegador, ciente de que isso pode encerrar a sessão ou remover preferências salvas.",
    ],
  },
  {
    title: "F) Compartilhamento de dados",
    content: [
      "O Calcify não vende dados pessoais. Dados poderão ser compartilhados apenas quando necessário para operar o serviço, cumprir obrigação legal, proteger direitos, prevenir fraude, atender ordem de autoridade competente ou viabilizar infraestrutura técnica contratada.",
      "Prestadores de hospedagem, banco de dados, autenticação, análise, atendimento ou comunicação podem tratar dados em nome do Calcify, sempre limitados às finalidades necessárias para prestação do serviço.",
    ],
  },
  {
    title: "G) Retenção e exclusão",
    content: [
      "Os dados serão mantidos pelo tempo necessário para cumprir as finalidades desta política, manter a conta, operar documentos, prestar suporte, cumprir obrigações legais ou preservar direitos.",
      "O usuário pode solicitar acesso, correção, atualização, portabilidade, limitação de uso ou exclusão de dados pessoais. Algumas informações podem ser mantidas quando houver obrigação legal, necessidade de auditoria, prevenção a fraude ou defesa em processos.",
    ],
  },
  {
    title: "H) Segurança",
    content: [
      "Empregamos medidas técnicas e organizacionais para proteger contas, documentos e registros de acesso, incluindo autenticação por token, senhas criptografadas, controle de permissões e restrição de acesso administrativo.",
      "Apesar dos esforços de segurança, nenhum sistema é totalmente imune a falhas, ataques ou usos indevidos. O usuário também deve proteger suas credenciais, evitar compartilhar senhas e acessar o serviço apenas em dispositivos confiáveis.",
    ],
  },
  {
    title: "I) Canais de contato",
    content: [
      "Para dúvidas sobre esta Política de Privacidade, solicitações relacionadas a dados pessoais ou exercício de direitos previstos na LGPD, entre em contato pelo e-mail: contato.marcos.nathanael@gmail.com.",
      "O encarregado pelo tratamento de dados pode ser contatado pelo mesmo e-mail.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />

      <section className="border-zinc-200 border-b bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f8fafc_52%,#ffffff_100%)]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold text-emerald-700">Calcify</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">
            Esta página explica como tratamos dados pessoais, cookies,
            documentos, compartilhamentos, contas e regras relacionadas ao plano
            pago do Calcify.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Última atualização: 1 de junho de 2026.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="space-y-10">
          {sections.map((section) => (
            <article
              key={section.title}
              className="border-zinc-200 border-b pb-8 last:border-b-0"
            >
              <h2 className="text-xl font-semibold text-zinc-950">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
          Esta política deve ser lida junto com as condições de uso do serviço,
          quando disponíveis. Para falar sobre privacidade, escreva para{" "}
          <Link
            href="mailto:contato.marcos.nathanael@gmail.com"
            className="font-semibold underline-offset-4 hover:underline"
          >
            contato.marcos.nathanael@gmail.com
          </Link>
          .
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
