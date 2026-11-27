# Prumo

Prumo é uma plataforma para apoiar o desenvolvimento de Trabalhos de
Conclusão de Curso (TCC), reunindo acompanhamento de etapas e prazos,
documentação do projeto e recursos de colaboração. O módulo de TCC usa Next.js
14 (App Router), TypeScript, PostgreSQL e Prisma.

## Módulo de TCC

O módulo de TCC está sendo desenvolvido incrementalmente em 10 etapas. Sua
arquitetura é declarativa e orientada a dados: modelos institucionais descrevem
estrutura, formatação, seções e regras de composição como dados validados, em
vez de embutir regras de uma instituição específica no código. Isso permite
configurar diferentes modelos institucionais sem acoplamento rígido a um
regulamento particular.

O modelo contempla projetos, autores, membros e papéis de acesso, seções,
versões, comentários e arquivos. O conteúdo do editor é um documento JSON
validado e versionado.

### Segurança e integridade

- A composição de modelos e a avaliação de condições usam estruturas
  declarativas conhecidas; não executam expressões fornecidas como código e não
  usam `eval` nem `new Function`.
- A validação de JSON bloqueia as chaves `__proto__`, `prototype` e
  `constructor`, acessores, protótipos personalizados, símbolos, referências
  circulares e outros valores que não pertencem a JSON seguro.
- Versões publicadas ou arquivadas são imutáveis. Projetos guardam snapshots
  independentes do modelo institucional, preservando a definição utilizada
  mesmo que o modelo original evolua.
- `AutorTcc` representa a autoria acadêmica declarada no projeto;
  `MembroProjetoTcc` representa um usuário da plataforma associado ao projeto e seu
  papel de acesso. São relações diferentes e não devem ser confundidas.
- Arquivos são registrados separadamente como `ArquivoTcc`. O documento do
  editor contém referências por ID (`fileId` ou `attachmentId`), não os
  arquivos em si.

### Etapas

- **Etapas 1 a 4:** concluídas e em commits.
- **Etapa 5:** próxima etapa; ainda não iniciada.
- **Etapas 6 a 10:** planejadas.

O escopo atual permanece nas etapas concluídas; esta documentação não antecipa
nem implementa o trabalho da Etapa 5.

## Requisitos

- Node.js 20 ou superior e npm.
- Docker e Docker Compose para executar o PostgreSQL local.

## Desenvolvimento local

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

O servidor fica disponível em <http://localhost:3000>. Como alternativa, o
script `npm run setup` automatiza a inicialização do banco, instalação de
dependências, configuração inicial do `.env`, geração do cliente Prisma,
migrations e seed. Revise e preencha as variáveis do `.env` antes de usar
integrações externas.

## Variáveis de ambiente

Configure-as no arquivo `.env` local. Não versione credenciais:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL usada pelo Prisma. |
| `AUTH_SECRET` | Segredo da autenticação. Configure um valor forte e privado. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Configuração do servidor de envio de e-mail. |
| `LEMBRETE_EMAIL_DESTINO` | Destinatário configurado para lembretes. |
| `CRON_SECRET` | Segredo usado para proteger a execução do cron de lembretes. |
| `TCC_MODEL_MANAGER_IDS` | IDs de usuários autorizados a administrar modelos institucionais, separados por vírgula. Se estiver vazia ou ausente, ninguém recebe essa permissão (*deny-by-default*). |

Os valores de exemplo estão em [.env.example](./.env.example). Nunca use
credenciais de exemplo em produção.

## Estrutura relevante

```text
app/
  (dashboard)/        Telas do sistema
  api/                Rotas de API
    tcc/              Endpoints do módulo de TCC
components/           Componentes da interface, incluindo components/ui/
lib/
  tcc/                Schemas, validação, autorização e serviços do módulo de TCC
  validations/        Schemas de validação compartilhados
  queries/            Consultas server-side
prisma/
  schema.prisma       Modelos de dados e relações
  migrations/         Histórico de migrations do banco
  seed.ts             Seed de desenvolvimento
scripts/              Scripts de setup e tarefas auxiliares
```

## Comandos de desenvolvimento e validação

```bash
npm run dev
npm test
npx tsc --noEmit
npx prisma validate
npx prisma generate
npm run build
git diff --check
```

`npm run dev` inicia o servidor local. Os demais comandos verificam testes,
tipos, schema e geração do Prisma, build de produção e whitespace do diff,
respectivamente. Testes E2E, quando necessários, podem ser executados com
`npm run test:e2e`.

## Commits e alterações locais

Prefira commits atômicos, com uma única intenção, seguindo
[Conventional Commits](https://www.conventionalcommits.org/), por exemplo
`docs: atualiza README do módulo TCC`. Antes de preparar um commit, confira
`git status` e revise o diff; adicione somente os arquivos da tarefa. Preserve
alterações preexistentes no worktree: não as descarte nem as inclua
acidentalmente no commit.
