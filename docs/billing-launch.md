# Ativação de assinaturas e Resend

## Estado

Implementação local; ainda não publicada nem habilitada para cobranças reais.
Preço mantido: R$ 23,99 por mês. Trial: um mês de calendário, cartão obrigatório, uma utilização por CPF. A assinatura renova automaticamente se não houver cancelamento.

## Variáveis na API (.NET)

Configure no gerenciador de segredos da hospedagem, nunca no frontend ou no Git:

| Variável | Valor |
| --- | --- |
| `Billing__Enabled` | `false` durante preparação; `true` depois da validação |
| `Billing__SecretKey` | Chave Stripe do ambiente correspondente |
| `Billing__WebhookSecret` | Segredo do endpoint de webhook correspondente |
| `Billing__PriceId` | Preço mensal BRL 2399 do ambiente correspondente |
| `Billing__PortalConfigurationId` | Configuração de portal correspondente |
| `Billing__CpfHmacKey` | Segredo aleatório de pelo menos 32 caracteres, exclusivo e durável |
| `Billing__SiteUrl` | `https://www.calcify.com.br` |
| `Resend__ApiKey` | Chave Resend com permissão de envio |
| `Resend__From` | `Calcify <conta@DOMINIO_VERIFICADO>` |

Não trocar a chave HMAC sem migração: ela mantém a unicidade do CPF e o histórico de benefício. Incluí-la no procedimento de backup de segredos. CPF é validado por formato/dígitos; isso não comprova a identidade da pessoa.

## Resend

1. Entrar no Resend e cadastrar o domínio de envio.
2. Publicar os registros DNS exatos indicados pelo Resend e aguardar a verificação.
3. Criar a chave de envio e salvar diretamente na hospedagem como `Resend__ApiKey`.
4. Definir `Resend__From` com o domínio verificado.
5. Testar cadastro e reenvio com uma caixa real controlada pelo responsável. O link expira em 24 horas e funciona uma única vez.

A API usa [POST /emails](https://resend.com/docs/api-reference/emails/send-email). Sem chave Resend, mantém compatibilidade com SMTP (`Smtp__Host`, `Port`, `Username`, `Password`, `From`). Não é necessário configurar os dois. Os testes automatizados simulam o provedor; não comprovam entrega real.

## Stripe configurado em teste

Conta: `acct_1UUdjdATa5u2YsGS`.

- Produto: `prod_VVgIKtkeGaSDO2` — Calcify Premium.
- Preço: `price_1UUew7ATa5u2YsGSxJ8S4Jp1` — BRL 2399/mês.
- Portal: `bpc_1UUfQKATa5u2YsGSn4JfHm6F`.
- Portal permite atualização de pagamento, histórico de faturas e cancelamento ao final do período.

Esses IDs são exclusivamente de teste. Criar equivalentes no modo real antes de ativar produção. Não foram realizadas cobranças reais.

Após publicar a API, criar endpoint HTTPS `https://HOST_DA_API/api/billing/webhook`, usando a versão Stripe configurada pela aplicação, com eventos:

- `checkout.session.completed`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`

Guardar o segredo do endpoint. O webhook valida assinatura e ambiente e consulta o estado atual no Stripe; há reconciliação periódica a cada cinco minutos. Confirmar recebimento de eventos e logs antes do lançamento.

## Migração e ativação

1. Backup do banco e dos segredos. Publicar API com `Billing__Enabled=false`; schema aditivo é aplicado na inicialização.
2. Conferir perfis existentes. Administradores são preservados; nenhum e-mail recebe promoção automática.
3. Listar usuários legados e registrar explicitamente concessões gratuitas com motivo e validade no painel administrativo. Não há concessão automática.
4. Publicar frontend com a URL correta da API e conferir CORS.
5. Definir a política de retenção do identificador CPF após exclusão, atualizar os textos aplicáveis e o procedimento de contestação de CPF. Definir também o tratamento operacional de estornos e disputas; ele não está automatizado neste fluxo.
6. Em homologação, configurar Stripe de teste e Resend; habilitar a flag e validar cadastro → e-mail → cartão → trial → renovação, falha, cancelamento, exclusão/recriação e concessão.
7. Configurar credenciais, preço, portal e webhook reais; só então habilitar produção.

Com a flag ativa, usuários sem Premium vão à tela de assinatura e podem abrir o Stripe ou seus documentos próprios em modo leitura/exportação. Ao acessar o editor com uma assinatura anterior vencida e identidade confirmada, abre automaticamente a regularização no Stripe; ao voltar, mantém a opção de leitura sem entrar em ciclo de redirecionamento. Ao voltar do Checkout com sucesso, solicita sincronização. Falhas de renovação não autorizam novas edições. Administradores e concessões válidas têm acesso, salvo bloqueio administrativo.

Desligar a flag restaura o acesso legado, mas **não cancela cobranças já existentes no Stripe**. Em incidente financeiro, tratar as assinaturas também no Stripe.

## Validação local

Frontend: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm exec next build --webpack`.

API: `CALCIFY_TEST_DATABASE='<PostgreSQL local isolado>' dotnet test tests/ApiCalcify.Tests`.

Os testes de integração criam bancos temporários exclusivos. Nunca apontar para produção. Cobrem concorrência/idempotência de Checkout, eventos fora de ordem, inadimplência, autorização, exclusão e não repetição do trial. O teste completo no Stripe e a entrega real pelo Resend ainda dependem das credenciais.

## Configuração externa iniciada em 26/10/2026

- Resend: cadastrado `mail.calcify.com.br` na região São Paulo, ID `ed7d405e-c121-4ed9-b569-6b2ff9b095e1`; verificação DNS pendente.
- Railway: projeto Calcify, serviço `api.calcify`, ambiente `production`. `Resend__From=Calcify <conta@mail.calcify.com.br>` e `Billing__SiteUrl=https://www.calcify.com.br` salvos como duas alterações pendentes; não foi acionado Deploy.
- API pública observada: `https://api-calcify-production.up.railway.app`. Deploy ativo ainda anterior à integração.
- Não foi criada chave Resend. Preparar Sending access restrito ao domínio após verificação; salvar apenas no Railway como `Resend__ApiKey`.
- Conexão Vercel retornou 403 para o domínio e nenhuma equipe. Navegador exige conclusão do login/2FA pelo usuário. Não registrar URLs de autenticação nem tokens.

Registros fornecidos pelo Resend para a zona `calcify.com.br` (adicionar, preservando registros existentes):

| Nome | Tipo | Valor | TTL |
| --- | --- | --- | --- |
| `resend._domainkey.mail` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDfXfnO5FagL8RxW3U6u6KSX2LNmpWidBhjgmb4n3bOqL49DGXaPmyNNtLgkXwTHQnVp3qGnz1Q2woq6zzqsTSxJcBJe+QE/VvgmjOIRKEliYxpLG/JHG4wdnytlLZFOsu6+IJAzZRa9BihCjLK5T9bT4sl9dqGtHKloIsJtBGpTwIDAQAB` | Auto |
| `rsend.mail` | CNAME | `rsend-sae1.forge.rmta.net` | 60 |
| `send.mail` | CNAME | `send.forge.rmta.net` | 60 |

Esses valores são registros DNS públicos, não credenciais. Após publicação, verificar no Resend. Recebimento permanece desabilitado; não substituir políticas DMARC existentes.
