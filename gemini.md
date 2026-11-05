# Contexto do Projeto — SICOM TCC

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind + shadcn/ui
- Prisma ORM + PostgreSQL 16 (Docker)
- Zod para validação
- date-fns para datas
- Nodemailer + googleapis para lembretes

## Regras
- Não alterar arquivos em `components/ui/` (shadcn gerado).
- Toda API Route deve validar entrada com Zod.
- Toda data no banco é `DateTime` (UTC).
- Comentários e UI em português.
- Não criar arquivos fora da estrutura acordada sem avisar.
- shadcn/ui usa **Radix** (style: `radix-nova`). NÃO sugerir código baseado em Base UI.
- Componentes ficam em `components/ui/`, não recriar primitivas.
- O `style` em `components.json` é `radix-nova`; não tentar alterar para `default` ou `new-york`.

## Estrutura de pastas
/app
  /(dashboard)
  /api
/components
/lib
/prisma