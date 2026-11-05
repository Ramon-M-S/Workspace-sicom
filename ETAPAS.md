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
- [~] 0.5 shadcn/ui inicializado
- [ ] 0.6 Prisma configurado + conexão validada

## Fase 1 — Banco e domínio

- [ ] 1.1 Schema Prisma: Fase, Etapa, Anotacao, Lembrete
- [ ] 1.2 Migration inicial
- [ ] 1.3 Seed com as etapas do TCC
- [ ] 1.4 Prisma Studio validado

## Fase 2 — Backend (API Routes)

- [ ] 2.1 CRUD de etapas (GET, POST, PATCH, DELETE)
- [ ] 2.2 CRUD de anotações
- [ ] 2.3 Validação Zod em todas as rotas
- [ ] 2.4 Cálculo de próximos lembretes

## Fase 3 — Frontend

- [ ] 3.1 Layout base (sidebar, header)
- [ ] 3.2 Dashboard com progresso e próxima etapa
- [ ] 3.3 Lista de etapas filtrável
- [ ] 3.4 Detalhe da etapa com anotações
- [ ] 3.5 Roadmap/Gantt simplificado

## Fase 4 — Integrações

- [ ] 4.1 Geração de `.ics` por etapa
- [ ] 4.2 Botão “Adicionar ao Google Agenda”
- [ ] 4.3 Envio de e-mail com Nodemailer
- [ ] 4.4 Cron de lembretes (7d, 1d, 0d)

## Fase 5 — Qualidade

- [ ] 5.1 Testes unitários com Vitest
- [ ] 5.2 Smoke test com Playwright (opcional)
- [ ] 5.3 Build de produção validado
