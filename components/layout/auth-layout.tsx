"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

const etapasTrilha = [
  {
    numero: "01",
    nome: "Planejamento",
    resumo: "Tema, recorte e cronograma",
    x: 135,
    y: 150,
    conector: "M 148 150 Q 178 132 198 118",
    lado: "esquerda",
    delayMarcador: "0.65s",
    delayTexto: "0.85s",
  },
  {
    numero: "02",
    nome: "Revisão",
    resumo: "Leituras e referencial teórico",
    x: 415,
    y: 165,
    conector: "M 402 165 Q 372 152 352 146",
    lado: "direita",
    delayMarcador: "1.25s",
    delayTexto: "1.45s",
  },
  {
    numero: "03",
    nome: "Metodologia",
    resumo: "Abordagem, métodos e instrumentos",
    x: 245,
    y: 350,
    conector: "M 258 350 Q 292 342 318 338",
    lado: "esquerda",
    delayMarcador: "1.85s",
    delayTexto: "2.05s",
  },
  {
    numero: "04",
    nome: "Escrita",
    resumo: "Capítulos no teu ritmo",
    x: 590,
    y: 445,
    conector: "M 577 445 Q 554 445 538 452",
    lado: "direita",
    delayMarcador: "2.45s",
    delayTexto: "2.65s",
  },
  {
    numero: "05",
    nome: "Defesa",
    resumo: "Apresentação e conclusão",
    x: 345,
    y: 595,
    conector: "M 358 595 Q 382 595 402 592",
    lado: "esquerda",
    delayMarcador: "3.0s",
    delayTexto: "3.2s",
  },
] as const;

const TRILHA_PATH_D =
  "M 28 36 C 115 22, 130 105, 225 92 C 335 78, 375 168, 325 245 C 275 322, 345 362, 465 375 C 575 388, 575 478, 475 522 C 385 562, 395 645, 515 662 C 575 670, 595 628, 645 636 C 685 642, 695 666, 722 666";

const DURACAO_REVELACAO_MS = 3600;
const ATRASO_INICIAL_MS = 150;

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pontaPrumo, setPontaPrumo] = useState<{
    x: number;
    y: number;
    angulo: number;
    visivel: boolean;
  }>({
    x: 28,
    y: 36,
    angulo: 0,
    visivel: false,
  });

  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    const totalLength = pathEl.getTotalLength();
    if (!totalLength) return;

    const atualizarPosicao = (distancia: number) => {
      const clamped = Math.max(0, Math.min(totalLength, distancia));
      const ponto = pathEl.getPointAtLength(clamped);
      const delta = Math.min(2, totalLength - clamped);
      const proximo =
        delta > 0.2
          ? pathEl.getPointAtLength(clamped + delta)
          : pathEl.getPointAtLength(Math.max(0, clamped - 2));
      const angulo =
        delta > 0.2
          ? (Math.atan2(proximo.y - ponto.y, proximo.x - ponto.x) * 180) / Math.PI
          : (Math.atan2(ponto.y - proximo.y, ponto.x - proximo.x) * 180) / Math.PI;

      setPontaPrumo({
        x: ponto.x,
        y: ponto.y,
        angulo,
        visivel: true,
      });
    };

    const prefereMovimentoReduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefereMovimentoReduzido) {
      atualizarPosicao(totalLength);
      return;
    }

    atualizarPosicao(0);

    let rafId = 0;
    const inicioAnimacao = performance.now() + ATRASO_INICIAL_MS;

    const passo = (agora: number) => {
      if (agora < inicioAnimacao) {
        atualizarPosicao(0);
        rafId = requestAnimationFrame(passo);
        return;
      }

      const progressoBruto = Math.min(
        1,
        Math.max(0, (agora - inicioAnimacao) / DURACAO_REVELACAO_MS)
      );
      const progressoSuave = easeInOut(progressoBruto);
      atualizarPosicao(totalLength * progressoSuave);

      if (progressoBruto < 1) {
        rafId = requestAnimationFrame(passo);
      } else {
        atualizarPosicao(totalLength);
      }
    };

    rafId = requestAnimationFrame(passo);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="flex min-h-screen w-full bg-[#164E45]">
      {/* Coluna esquerda: proposta de valor + trilha ampla e fluida */}
      <section className="relative hidden min-h-screen w-1/2 flex-col justify-between overflow-hidden bg-[#F5F7F2] px-8 py-6 text-[#18352F] lg:flex xl:px-12 xl:py-8">
        {/* Elementos decorativos e malha editorial subtil */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "radial-gradient(#164E45 0.75px, transparent 0.75px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#D9A84E]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-[#164E45]/[0.09] blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-[10%] size-28 rounded-full border border-[#164E45]/15" />

        {/* Cabeçalho editorial */}
        <div className="relative z-10 max-w-xl">
          <div className="mb-3 flex items-center gap-3">
            <Logo size={40} decorative />
            <span className="font-display text-2xl font-semibold text-[#164E45]">
              Prumo
            </span>
          </div>

          <h1 className="max-w-lg font-display text-3xl font-semibold leading-[1.12] text-[#164E45] xl:text-[42px]">
            Um passo de cada vez.
            <br />
            Um TCC no seu ritmo.
          </h1>

          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#52665F] xl:text-base">
            O caminho fica mais claro quando você não precisa carregar tudo na cabeça.
          </p>
        </div>

        {/* Trilha ampla, sinuosa e fluida */}
        <div className="relative z-10 -mx-4 my-1 flex-1 min-h-[410px] xl:-mx-8">
          <svg
            viewBox="0 0 760 720"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label="Trilha do TCC: Planejamento, Revisão, Metodologia, Escrita e Defesa"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <style>{`
                @keyframes prumoRevelarTrilha {
                  0% {
                    stroke-dashoffset: 1600;
                  }
                  100% {
                    stroke-dashoffset: 0;
                  }
                }
                @keyframes prumoRevelarEtapa {
                  0% {
                    opacity: 0;
                    transform: scale(0.82);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
                @keyframes prumoRevelarTexto {
                  0% {
                    opacity: 0;
                    transform: translateY(6px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .prumo-trilha-desenho {
                  stroke-dasharray: 1600;
                  stroke-dashoffset: 1600;
                  animation: prumoRevelarTrilha 3.6s ease-in-out 0.15s forwards;
                }
                .prumo-marcador-etapa {
                  transform-box: fill-box;
                  transform-origin: center;
                  opacity: 0;
                  animation: prumoRevelarEtapa 0.5s ease-out forwards;
                }
                .prumo-rotulo-etapa {
                  transform-box: fill-box;
                  transform-origin: center;
                  opacity: 0;
                  animation: prumoRevelarTexto 0.5s ease-out forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                  .prumo-trilha-desenho {
                    stroke-dasharray: none;
                    stroke-dashoffset: 0;
                    animation: none;
                  }
                  .prumo-marcador-etapa,
                  .prumo-rotulo-etapa {
                    opacity: 1;
                    transform: none;
                    animation: none;
                  }
                }
              `}</style>
            </defs>

            {/* Caminho principal orgânico + extensão ondulada até a seta direita */}
            <path
              ref={pathRef}
              d={TRILHA_PATH_D}
              fill="none"
              stroke="#164E45"
              strokeWidth="12"
              strokeLinecap="round"
              className="prumo-trilha-desenho"
            />

            {/* Ponta do prumo acompanhando o avanço e a orientação do traçado */}
            {pontaPrumo.visivel && (
              <g
                transform={`translate(${pontaPrumo.x}, ${pontaPrumo.y}) rotate(${pontaPrumo.angulo})`}
              >
                <circle cx="-12" cy="-1" r="4" fill="#164E45" />
                <polygon
                  points="-16,-20 42,0 -16,18"
                  fill="#EAB34B"
                  stroke="#164E45"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Conectores subtis, marcadores dourados e rótulos das etapas */}
            {etapasTrilha.map((etapa) => {
              const textoNaEsquerda = etapa.lado === "esquerda";
              return (
                <g key={etapa.nome}>
                  <path
                    d={etapa.conector}
                    fill="none"
                    stroke="#D9A84E"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.75"
                    style={{ animationDelay: etapa.delayMarcador }}
                    className="prumo-rotulo-etapa"
                  />
                  <g
                    style={{ animationDelay: etapa.delayMarcador }}
                    className="prumo-marcador-etapa"
                  >
                    <circle
                      cx={etapa.x}
                      cy={etapa.y}
                      r="18"
                      fill="#EAB34B"
                      fillOpacity="0.18"
                    />
                    <circle
                      cx={etapa.x}
                      cy={etapa.y}
                      r="13"
                      fill="#EAB34B"
                      stroke="#164E45"
                      strokeWidth="2"
                    />
                  </g>
                  <g
                    style={{ animationDelay: etapa.delayTexto }}
                    className="prumo-rotulo-etapa"
                  >
                    <text
                      x={etapa.x + (textoNaEsquerda ? -24 : 24)}
                      y={etapa.y - 2}
                      textAnchor={textoNaEsquerda ? "end" : "start"}
                      fill="#164E45"
                      fontFamily="var(--font-source-sans-3), Arial, sans-serif"
                      fontSize="19"
                      fontWeight="700"
                    >
                      {`${etapa.numero} · ${etapa.nome}`}
                    </text>
                    <text
                      x={etapa.x + (textoNaEsquerda ? -24 : 24)}
                      y={etapa.y + 19}
                      textAnchor={textoNaEsquerda ? "end" : "start"}
                      fill="#52665F"
                      fontFamily="var(--font-source-sans-3), Arial, sans-serif"
                      fontSize="14"
                      fontWeight="500"
                    >
                      {etapa.resumo}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Rodapé editorial */}
        <p className="relative z-10 text-sm text-[#52665F]">
          Respire. O próximo passo está mais perto do que parece.
        </p>
      </section>

      {/* Coluna direita: área do formulário (ex.: card "Entrar no Prumo") */}
      <section className="flex w-full items-center justify-center bg-[#164E45] p-4 sm:p-8 lg:w-1/2">
        {children}
      </section>
    </main>
  );
}