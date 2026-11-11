import "dotenv/config";
import { prisma } from "../lib/prisma";

const fases = [
  { id: "fase-planejamento", ordem: 1, nome: "Planejamento" },
  { id: "fase-analise", ordem: 2, nome: "Análise" },
  { id: "fase-projeto", ordem: 3, nome: "Projeto" },
  { id: "fase-desenvolvimento", ordem: 4, nome: "Desenvolvimento" },
  { id: "fase-monografia", ordem: 5, nome: "Monografia" },
] as const;

const etapas = [
  { id: "p01-revisao-bibliografica", faseId: "fase-planejamento", ordem: 1, titulo: "P01 Revisão bibliográfica e consolidação de referências", objetivo: "Consolidar a base teórica e as referências que fundamentam o SICOM.", entregaveis: ["Referências bibliográficas revisadas", "Síntese dos trabalhos relacionados"], dod: ["Fontes relevantes registradas", "Referências padronizadas e conferidas"], inicio: "2026-11-05", fim: "2026-11-14", specKit: null },
  { id: "p02-refatorar-documento-de-visao", faseId: "fase-planejamento", ordem: 2, titulo: "P02 Refatorar Documento de Visão", objetivo: "Alinhar o Documento de Visão ao escopo e às necessidades atuais do SICOM.", entregaveis: ["Documento de Visão revisado", "Escopo e atores atualizados"], dod: ["Requisitos e objetivos consistentes", "Documento revisado pela equipe"], inicio: "2026-11-10", fim: "2026-11-21", specKit: null },
  { id: "p03-constituicao-do-projeto-no-spec-kit", faseId: "fase-planejamento", ordem: 3, titulo: "P03 Constituição do projeto no Spec Kit", objetivo: "Definir os princípios e as diretrizes que orientarão o desenvolvimento do SICOM.", entregaveis: ["Constituição do projeto", "Princípios técnicos e de produto"], dod: ["Diretrizes registradas no Spec Kit", "Constituição revisada e coerente com a visão"], inicio: "2026-11-17", fim: "2026-11-21", specKit: "/speckit.constitution" },
  { id: "p04-atualizar-pre-projeto", faseId: "fase-planejamento", ordem: 4, titulo: "P04 Atualizar Pré-Projeto", objetivo: "Atualizar o pré-projeto para refletir o escopo, método e cronograma do TCC.", entregaveis: ["Pré-Projeto atualizado", "Cronograma e metodologia revisados"], dod: ["Seções alinhadas ao SICOM", "Documento pronto para validação"], inicio: "2026-11-21", fim: "2026-11-28", specKit: null },
  { id: "a01-especificacao-funcional", faseId: "fase-analise", ordem: 1, titulo: "A01 Especificação funcional", objetivo: "Descrever os requisitos funcionais e os principais fluxos do SICOM.", entregaveis: ["Especificação funcional", "Histórias e critérios de aceite"], dod: ["Requisitos rastreáveis", "Fluxos principais documentados"], inicio: "2026-11-24", fim: "2026-12-05", specKit: "/speckit.specify" },
  { id: "a02-clarificacao-da-especificacao", faseId: "fase-analise", ordem: 2, titulo: "A02 Clarificação da especificação", objetivo: "Resolver ambiguidades e registrar decisões sobre os requisitos do SICOM.", entregaveis: ["Especificação clarificada", "Decisões e respostas registradas"], dod: ["Questões críticas respondidas", "Requisitos atualizados com as decisões"], inicio: "2026-12-01", fim: "2026-12-10", specKit: "/speckit.clarify" },
  { id: "a03-requisitos-nao-funcionais", faseId: "fase-analise", ordem: 3, titulo: "A03 Requisitos não funcionais", objetivo: "Definir os requisitos de qualidade, segurança e operação do SICOM.", entregaveis: ["Requisitos não funcionais", "Critérios de qualidade"], dod: ["Requisitos verificáveis", "Restrições e prioridades documentadas"], inicio: "2026-12-08", fim: "2026-12-15", specKit: null },
  { id: "a04-wireframes-e-fluxos-de-usuario", faseId: "fase-analise", ordem: 4, titulo: "A04 Wireframes e fluxos de usuário", objetivo: "Representar as telas e jornadas essenciais para validar a experiência do SICOM.", entregaveis: ["Wireframes das telas principais", "Fluxos de usuário"], dod: ["Jornadas principais cobertas", "Telas alinhadas aos requisitos"], inicio: "2026-12-10", fim: "2026-12-20", specKit: null },
  { id: "a05-validacao-com-stakeholders", faseId: "fase-analise", ordem: 5, titulo: "A05 Validação com stakeholders", objetivo: "Validar requisitos e fluxos do SICOM com as partes interessadas.", entregaveis: ["Registro de validação", "Lista de ajustes priorizados"], dod: ["Feedback documentado", "Ajustes incorporados ou priorizados"], inicio: "2026-12-15", fim: "2026-12-22", specKit: null },
  { id: "d01-modelagem-de-dominio", faseId: "fase-projeto", ordem: 1, titulo: "D01 Modelagem de domínio", objetivo: "Estruturar entidades, relações e regras centrais do domínio do SICOM.", entregaveis: ["Modelo de domínio", "Descrição das regras principais"], dod: ["Entidades e relações revisadas", "Regras alinhadas aos requisitos"], inicio: "2027-01-05", fim: "2027-01-12", specKit: null },
  { id: "d02-arquitetura-offline-first-e-sincronizacao", faseId: "fase-projeto", ordem: 2, titulo: "D02 Arquitetura offline-first e sincronização", objetivo: "Definir como o SICOM opera sem conexão e sincroniza os dados posteriormente.", entregaveis: ["Arquitetura offline-first", "Fluxo e estratégia de sincronização"], dod: ["Cenários offline e online descritos", "Conflitos e recuperação considerados"], inicio: "2027-01-07", fim: "2027-01-16", specKit: null },
  { id: "d03-sdd-e-diagramas-plantuml", faseId: "fase-projeto", ordem: 3, titulo: "D03 SDD e diagramas PlantUML", objetivo: "Documentar o desenho do sistema e suas interações por meio de diagramas.", entregaveis: ["Documento de desenho do sistema", "Diagramas PlantUML"], dod: ["Componentes e interações representados", "Diagramas consistentes com a arquitetura"], inicio: "2027-01-12", fim: "2027-01-23", specKit: null },
  { id: "d04-modelagem-e-criacao-do-banco", faseId: "fase-projeto", ordem: 4, titulo: "D04 Modelagem e criação do banco", objetivo: "Projetar a persistência de dados necessária aos requisitos do SICOM.", entregaveis: ["Modelo de dados", "Estrutura inicial do banco"], dod: ["Entidades e relações documentadas", "Modelo compatível com os fluxos previstos"], inicio: "2027-01-19", fim: "2027-01-27", specKit: null },
  { id: "d05-especificacao-de-apis-e-dtos", faseId: "fase-projeto", ordem: 5, titulo: "D05 Especificação de APIs e DTOs", objetivo: "Definir contratos de comunicação e estruturas de dados da aplicação.", entregaveis: ["Especificação das APIs", "DTOs e exemplos de payload"], dod: ["Endpoints e contratos documentados", "DTOs alinhados ao domínio"], inicio: "2027-01-22", fim: "2027-01-30", specKit: null },
  { id: "d06-plano-e-tarefas", faseId: "fase-projeto", ordem: 6, titulo: "D06 Plano e tarefas", objetivo: "Organizar a implementação em plano técnico e tarefas executáveis.", entregaveis: ["Plano de implementação", "Lista priorizada de tarefas"], dod: ["Tarefas relacionadas aos requisitos", "Plano revisado e pronto para execução"], inicio: "2027-01-26", fim: "2027-01-30", specKit: "/speckit.plan + /speckit.tasks" },
  { id: "dev01-setup-e-pipeline", faseId: "fase-desenvolvimento", ordem: 1, titulo: "Dev01 Setup e pipeline", objetivo: "Preparar o ambiente de desenvolvimento e a automação básica do projeto.", entregaveis: ["Estrutura inicial do projeto", "Pipeline de integração"], dod: ["Aplicação executa no ambiente definido", "Pipeline valida mudanças básicas"], inicio: "2027-02-01", fim: "2027-02-05", specKit: null },
  { id: "dev02-backend-mvp", faseId: "fase-desenvolvimento", ordem: 2, titulo: "Dev02 Backend MVP", objetivo: "Implementar os serviços essenciais do backend para o MVP do SICOM.", entregaveis: ["Serviços e endpoints prioritários", "Persistência das funcionalidades centrais"], dod: ["Fluxos do MVP atendidos", "Contratos implementados conforme especificação"], inicio: "2027-02-03", fim: "2027-02-20", specKit: null },
  { id: "dev03-mobile-mvp", faseId: "fase-desenvolvimento", ordem: 3, titulo: "Dev03 Mobile MVP", objetivo: "Implementar no aplicativo móvel os fluxos essenciais definidos para o MVP.", entregaveis: ["Telas e navegação do MVP", "Integração inicial com os serviços"], dod: ["Fluxos prioritários utilizáveis", "Interface alinhada aos wireframes"], inicio: "2027-02-03", fim: "2027-02-20", specKit: null },
  { id: "dev04-integracao-e-sincronizacao", faseId: "fase-desenvolvimento", ordem: 4, titulo: "Dev04 Integração e sincronização", objetivo: "Integrar os componentes e implementar a sincronização de dados do SICOM.", entregaveis: ["Integração entre aplicativo e backend", "Sincronização dos dados"], dod: ["Fluxos integrados ponta a ponta", "Comportamento de sincronização verificado"], inicio: "2027-02-18", fim: "2027-02-25", specKit: null },
  { id: "dev05-testes-e-validacao", faseId: "fase-desenvolvimento", ordem: 5, titulo: "Dev05 Testes e validação", objetivo: "Verificar os principais fluxos e a qualidade do MVP do SICOM.", entregaveis: ["Casos e resultados de testes", "Registro de defeitos e ajustes"], dod: ["Fluxos críticos verificados", "Problemas prioritários tratados"], inicio: "2027-02-22", fim: "2027-02-28", specKit: null },
  { id: "dev06-homologacao", faseId: "fase-desenvolvimento", ordem: 6, titulo: "Dev06 Homologação", objetivo: "Homologar a versão integrada do MVP conforme os requisitos acordados.", entregaveis: ["Registro de homologação", "Versão candidata validada"], dod: ["Critérios de aceite avaliados", "Pendências registradas e priorizadas"], inicio: "2027-02-26", fim: "2027-02-28", specKit: null },
  { id: "m01-capitulos-1-3-da-monografia", faseId: "fase-monografia", ordem: 1, titulo: "M01 Capítulos 1–3 da monografia", objetivo: "Redigir introdução, fundamentação teórica e metodologia do TCC.", entregaveis: ["Capítulos 1 a 3", "Referências citadas"], dod: ["Capítulos coerentes com o projeto", "Citações e referências revisadas"], inicio: "2027-01-05", fim: "2027-02-10", specKit: null },
  { id: "m02-capitulos-4-5-da-monografia", faseId: "fase-monografia", ordem: 2, titulo: "M02 Capítulos 4–5 da monografia", objetivo: "Apresentar a implementação, os resultados e as conclusões do trabalho.", entregaveis: ["Capítulos 4 e 5", "Resultados e conclusões"], dod: ["Resultados relacionados aos objetivos", "Conclusões sustentadas pelo trabalho"], inicio: "2027-02-10", fim: "2027-02-20", specKit: null },
  { id: "m03-revisao-e-normas-abnt", faseId: "fase-monografia", ordem: 3, titulo: "M03 Revisão e normas ABNT", objetivo: "Revisar o texto final e adequá-lo às normas acadêmicas aplicáveis.", entregaveis: ["Monografia revisada", "Formatação conforme ABNT"], dod: ["Texto e referências revisados", "Documento final conferido"], inicio: "2027-02-20", fim: "2027-02-28", specKit: null },
  { id: "m04-preparacao-da-defesa", faseId: "fase-monografia", ordem: 4, titulo: "M04 Preparação da defesa", objetivo: "Preparar a apresentação e os materiais para a defesa do TCC.", entregaveis: ["Apresentação da defesa", "Roteiro de exposição"], dod: ["Conteúdo sintetiza o trabalho", "Apresentação ensaiada e revisada"], inicio: "2027-03-01", fim: "2027-03-10", specKit: null },
  { id: "m05-defesa", faseId: "fase-monografia", ordem: 5, titulo: "M05 Defesa", objetivo: "Apresentar e defender os resultados do TCC SICOM perante a banca.", entregaveis: ["Apresentação do trabalho", "Registro das considerações da banca"], dod: ["Defesa realizada", "Recomendações da banca registradas"], inicio: "2027-03-15", fim: "2027-03-15", specKit: null },
] as const;

export async function executarSeed() {
  await prisma.configuracao.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      nomeProjeto: "TCC - SICOM",
      ativoLembretes: true,
      diasAntecedencia: 7,
    },
    update: {},
  });

  for (const fase of fases) {
    await prisma.fase.upsert({
      where: { id: fase.id },
      create: fase,
      update: { ordem: fase.ordem, nome: fase.nome },
    });
  }

  for (const etapa of etapas) {
    const { inicio, fim, ...dadosEtapa } = etapa;
    await prisma.etapa.upsert({
      where: { id: etapa.id },
      create: {
        ...dadosEtapa,
        entregaveis: [...etapa.entregaveis],
        dod: [...etapa.dod],
        inicio: new Date(`${inicio}T00:00:00.000Z`),
        fim: new Date(`${fim}T00:00:00.000Z`),
      },
      update: {
        faseId: etapa.faseId,
        ordem: etapa.ordem,
        titulo: etapa.titulo,
        objetivo: etapa.objetivo,
        entregaveis: [...etapa.entregaveis],
        dod: [...etapa.dod],
        inicio: new Date(`${inicio}T00:00:00.000Z`),
        fim: new Date(`${fim}T00:00:00.000Z`),
        specKit: etapa.specKit,
      },
    });

    for (const diasAntes of [7, 1, 0]) {
      const id = `${etapa.id}-lembrete-${diasAntes}`;
      await prisma.lembrete.upsert({
        where: { id },
        create: { id, etapaId: etapa.id, diasAntes, canal: "ambos", enviado: false },
        update: { etapaId: etapa.id, diasAntes, canal: "ambos", enviado: false },
      });
    }
  }

  console.log(
    `Seed concluído: ${fases.length} fases, ${etapas.length} etapas e ${etapas.length * 3} lembretes criados/atualizados.`,
  );
}
