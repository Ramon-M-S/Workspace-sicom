# SICOM — Sistema de Gestão de TCC

> **Trabalho de Conclusão de Curso (TCC)** — Sistemas de Informação, IFMA  
> **Tema:** Plataforma de comunicação operacional para a Guarda Municipal de São Luís  
> **Status:** MVP Concluído e Funcional

---

## 📋 Sobre o Projeto

O **SICOM** é uma plataforma completa para gestão do Trabalho de Conclusão de Curso. Ele permite organizar etapas, prazos, referências, anotações e anexos, além de automatizar lembretes por e-mail e integração com calendários.

A metodologia de desenvolvimento seguiu o **Spec-Driven Development (SDD)**, utilizando IA (Gemini Code Assist) e o GitHub Spec Kit para transformar intenção em especificações executáveis antes de codificar.

---

## ✨ Funcionalidades Principais

- **Dashboard:** Visão geral do progresso com gráficos (Recharts) e exportação de relatório em PDF.
- **Lista de Etapas:** Filtros por fase, status e busca textual.
- **Detalhe da Etapa:** Objetivo, entregáveis, Definition of Done (DoD), anotações, anexos (PDF/imagens), histórico de alterações e exportação para calendário.
- **Roadmap:** Visualização em Gantt interativo com painel de urgências.
- **Kanban:** Visão de quadro com drag & drop para atualização de status.
- **Calendário:** Visão mensal dos prazos com sincronização.
- **Configurações:** Perfil do projeto, automação de lembretes e restauração de dados de fábrica.
- **Busca Global (Ctrl+K):** Paleta de comandos para encontrar etapas e anotações rapidamente.
- **Notificações:** Sino no header com alertas de prazos próximos e atrasados.
- **Modo Escuro:** Alternância entre tema claro e escuro com persistência.
- **Lembretes por E-mail:** Envio automático de e-mails de aviso (Nodemailer).
- **Integração com Calendário:** Geração de arquivos `.ics` e links diretos para o Google Agenda.

---

## 🚀 Inicialização Rápida (Setup Automatizado)

A forma mais rápida de rodar o projeto é usando o script de setup. Ele sobe o Docker, instala dependências, roda migrations e popula o banco.

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Git

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/sicom-tcc.git
cd sicom-tcc

# 2. Rode o script de setup
npm run setup
# (ou: ./scripts/setup.sh)

# 3. Edite o arquivo .env com suas credenciais (se ainda não existir)
# (O script cria o .env a partir do .env.example se não existir)

# 4. Inicie o servidor
npm run dev
```

Acesse: http://localhost:3000

### O que o script de setup faz?
1. Verifica se o Docker está rodando.
2. Sobe o container PostgreSQL (`docker compose up -d`).
3. Instala as dependências (`npm install`).
4. Cria o `.env` a partir do `.env.example` (se necessário).
5. Roda `prisma generate`, `prisma migrate deploy` e `prisma db seed`.

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env` na raiz com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://sicom:sicom@localhost:5432/sicom_dev?schema=public"

# SMTP (Ethereal para testes, Gmail para produção)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="seu-usuario@ethereal.email"
SMTP_PASS="sua-senha"
SMTP_FROM="SICOM TCC <seu-usuario@ethereal.email>"
LEMBRETE_EMAIL_DESTINO="seu-email@gmail.com"

# Segurança do Cron
CRON_SECRET="uma-senha-forte-aleatoria"
```

### Configurar o Ethereal (para testes)
1. Acesse https://ethereal.email/
2. Clique em **Create Ethereal Account**
3. Copie as credenciais e cole no `.env`

---

## 📁 Estrutura do Projeto

```text
sicom-tcc/
├── app/                      # App Router do Next.js
│   ├── (dashboard)/          # Rotas protegidas (layout com sidebar)
│   │   ├── dashboard/        # Visão geral e gráficos
│   │   ├── etapas/           # Lista e detalhe de etapas
│   │   ├── kanban/           # Visão Kanban
│   │   ├── calendario/       # Visão mensal de prazos
│   │   ├── roadmap/          # Gantt interativo
│   │   └── configuracoes/    # Configurações do sistema
│   ├── api/                  # API Routes
│   └── layout.tsx            # Root layout
├── components/
│   ├── layout/               # Sidebar, Header, Busca Global, Notificações
│   ├── etapas/               # Componentes de etapa
│   ├── dashboard/            # Gráficos e Botão PDF
│   ├── kanban/               # Board Kanban
│   ├── calendario/           # Calendário mensal
│   ├── roadmap/              # Componentes do roadmap
│   └── ui/                   # shadcn/ui
├── lib/
│   ├── prisma.ts             # Singleton do Prisma Client
│   ├── validations/          # Schemas Zod
│   ├── queries/              # Funções server-side
│   ├── lembretes.ts          # Cálculo de lembretes
│   ├── calendar.ts           # Geração de .ics e Google Agenda
│   ├── email.ts              # Envio de e-mails
│   ├── log.ts                # Registro de histórico
│   └── gerar-pdf.ts          # Geração de relatório PDF
├── prisma/
│   ├── schema.prisma         # Schema do banco
│   └── seed.ts               # Seed inicial
└── scripts/                  # Scripts utilitários
```

---

## 🧪 Testes

```bash
# Rodar todos os testes unitários
npm test

# Rodar testes em watch mode
npm run test:watch

# Rodar testes E2E (Playwright)
npm run test:e2e

# Rodar testes E2E com interface visual
npm run test:e2e:ui
```

---

## 🌐 Deploy

### Vercel (recomendado)
1. Importe o repositório no Vercel.
2. Configure as variáveis de ambiente (veja seção anterior).
3. Configure o cron em `vercel.json` (já incluído no projeto).
4. Deploy.

### Banco de Dados
O projeto usa PostgreSQL. Para produção, recomendamos:
- **Neon** (free tier): https://neon.tech
- **Supabase** (free tier): https://supabase.com

---

## 📚 Metodologia

O desenvolvimento seguiu o **Spec-Driven Development (SDD)**, utilizando IA (Gemini Code Assist) e o GitHub Spec Kit para transformar intenção em especificações executáveis antes de codificar. Cada etapa do TCC foi planejada de forma atômica, com entregáveis claros e critérios de conclusão (Definition of Done).

---

## 👨‍💻 Autor

**Gabriel** — Sistemas de Informação, IFMA  
**Orientador:** Prof. Dr. Hélder Pereira Borges  
**Ano:** 2026.2