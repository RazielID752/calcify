# Calcify

Calculadora inteligente em formato de editor. O Calcify permite escrever texto, usar Markdown e misturar expressoes matematicas no mesmo fluxo, com resultado automatico na propria linha.

## O que o Calcify faz

- Calcula expressoes como 20 + 15 = e completa o resultado automaticamente.
- Suporta variaveis, por exemplo: x = 10 e depois x * 3 =.
- Entende percentual em soma/subtracao, por exemplo: 200 + 10%.
- Tem suporte a moeda BRL, USD e EUR com formatacao.
- Permite formatacao rich text no editor (headings, listas, quote, code, link, etc.).
- Converte Markdown para HTML no editor.
- Roda como app web e como app desktop com Electron.

## Tecnologias principais

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Electron + electron-builder
- mathjs para avaliacao matematica

## Requisitos

- Node.js 20+
- pnpm

## Instalacao

```bash
pnpm install
```

Se for a primeira vez com Electron no ambiente, aprove builds nativos:

```bash
pnpm approve-builds
```

## Como rodar

### Web (desenvolvimento)

```bash
pnpm dev
```

Abra http://localhost:3000.

### Desktop (desenvolvimento)

```bash
pnpm dev:desktop
```

Esse comando sobe o Next em dev e abre o Electron apontando para localhost.

### Desktop (modo producao local)

```bash
pnpm build
pnpm start:desktop
```

Observacao: como o projeto usa output export no Next, o build gera a pasta out, que e usada pelo app desktop em producao.

## Build

## Release para producao

Antes de subir qualquer alteracao para producao, gere uma nova versao:

```bash
pnpm release:patch
```

Use `patch` para correcoes e melhorias pequenas, `minor` para funcionalidades novas e `major` para mudancas incompatíveis:

```bash
pnpm release:minor
pnpm release:major
```

O comando atualiza `package.json` e `app/config/release.json`. A versao exibida no editor, na secao de download e no endpoint desktop/latest passa a usar esses dados.

Na Vercel, o build usa `pnpm build:vercel` via `vercel.json`. Em deploy de producao, esse comando verifica se a release foi gerada para o dia atual antes de permitir o build.

Checklist antes de publicar em producao:

```bash
pnpm exec tsc --noEmit
pnpm lint
git add .
git commit -m "sua mensagem"
git push
```

O hook de `pre-commit` gera `release:patch` automaticamente quando voce esta na branch `main` e a release do dia ainda nao existe. Se precisar de `minor` ou `major`, rode manualmente antes do commit:

```bash
pnpm release:minor
pnpm release:major
```

Para instalar ou reinstalar os hooks locais:

```bash
pnpm hooks:install
```

Nao rode o comando de release dentro da Vercel: o build da Vercel e temporario e nao salva alteracoes no repositorio.

### Build web

```bash
pnpm build
```

Resultado principal:

- out (export estatico)

### Build desktop (instalador)

```bash
pnpm build:desktop
```

Saida em dist-desktop:

- macOS: DMG
- Windows: NSIS
- Linux: AppImage

## Scripts disponiveis

- pnpm dev: inicia app web em desenvolvimento
- pnpm build: gera build web (com export estatico)
- pnpm build:vercel: valida release e gera build web na Vercel
- pnpm start:desktop: abre Electron em modo producao local
- pnpm dev:desktop: web dev + Electron juntos
- pnpm build:desktop: build web + empacotamento desktop
- pnpm lint: verifica padrao de codigo com Biome
- pnpm format: formata o codigo com Biome
- pnpm hooks:install: instala os hooks locais de Git do projeto
- pnpm release:patch: gera uma nova versao patch antes do deploy em producao
- pnpm release:minor: gera uma nova versao minor
- pnpm release:major: gera uma nova versao major

## Como o desktop funciona

- Em desenvolvimento: Electron abre a URL de dev do Next.
- Em producao: Electron serve os arquivos estaticos da pasta out via servidor HTTP local interno.

Isso evita depender de servidor Next dentro do app empacotado.

## Troubleshooting rapido

- Electron nao abre apos install:
	- Rode pnpm approve-builds e reinstale dependencias se necessario.
- Janela desktop sem conteudo:
	- Rode pnpm build antes de pnpm start:desktop para garantir out atualizado.
- Porta do servidor local do Electron:
	- Pode ser ajustada com a variavel ELECTRON_PORT.

## Estrutura util

- app/components/editor.tsx: editor principal
- app/components/editor-commands.ts: comandos da toolbar
- app/components/hooks/use-auto-transforms.ts: transformacoes automaticas
- utils/calculate.ts: motor de calculo de linhas
- desktop/main.cjs: processo principal do Electron

## Licenca

Copyright (c) 2026 Marcos N. Todos os direitos reservados.
