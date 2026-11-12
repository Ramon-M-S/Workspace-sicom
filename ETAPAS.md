# Registro de Etapas — SICOM TCC

## Legenda
- [ ] Pendente
- [~] Em andamento
- [x] Concluído (verificado)

---

## Fase 0 — Base do projeto
- [x] 0.1 Repositório Git + Conventional Commits
- [x] 0.2 `.geminiignore` + `gemini.md`
- [x] 0.3 Docker Compose com PostgreSQL 16
- [x] 0.4 Next.js 14 + TypeScript + Tailwind
- [x] 0.5 shadcn/ui inicializado
- [x] 0.6 Prisma configurado + conexão validada

## Fase 1 — Banco e domínio
- [x] 1.1 Schema Prisma: Fase, Etapa, Anotacao, Lembrete
- [x] 1.2 Migration inicial
- [x] 1.3 Seed com as etapas do TCC
- [x] 1.4 Prisma Studio validado

## Fase 2 — Backend (API Routes)
- [x] 2.0 Fundação: prisma singleton, Zod, helpers HTTP
- [x] 2.1 CRUD de etapas
- [x] 2.2 CRUD de anotações
- [x] 2.3 Validação Zod em todas as rotas
- [x] 2.4 Cálculo de próximos lembretes

## Fase 3 — Frontend
- [x] 3.1 Layout base (sidebar, header)
- [x] 3.2 Dashboard com progresso e próxima etapa
- [x] 3.3 Lista de etapas filtrável
- [x] 3.4 Detalhe da etapa com anotações
- [x] 3.5 Roadmap/Gantt simplificado
- [x] 3.6 Configurações do Sistema

## Fase 4 — Integrações
- [x] 4.1 Geração de `.ics` por etapa
- [x] 4.2 Botão "Adicionar ao Google Agenda"
- [x] 4.3 Envio de e-mail com Nodemailer
- [x] 4.4 Cron de lembretes (7d, 1d, 0d)

## Fase 5 — Qualidade
- [x] 5.1 Testes unitários com Vitest
- [x] 5.2 Smoke test com Playwright (E2E)
- [x] 5.3 Build de produção validado

## Fase 6 — Melhorias e Polimento
- [x] 6.1 Busca Global (Ctrl+K)
- [x] 6.2 Notificações no Sistema (Sino)
- [x] 6.3 Anexos nas Etapas (Upload de PDF/Imagens)
- [x] 6.4 Exportar Relatório PDF
- [x] 6.5 Gráficos no Dashboard (Recharts)
- [x] 6.6 Histórico de Alterações (Log)
- [x] 6.7 Modo Escuro (Dark Mode)
- [x] 6.8 Visão Kanban (Drag & Drop)
- [x] 6.9 Calendário Integrado (Visão Mensal)

---

## Próximos Passos (Fora do Escopo do Software)
- [ ] Deploy na Vercel + Neon (Banco em Nuvem)
- [ ] Escrever a Monografia (Capítulos 1 a 5)
- [ ] Preparação para a Defesa
