import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Guia de Marca — Prumo",
  description: "Guia oficial de identidade e comunicação do Prumo.",
};

const colors = [
  { name: "Pinho", hex: "#164E45", text: "#F5F7F2" },
  { name: "Linho", hex: "#F5F7F2", text: "#18352F", border: true },
  { name: "Tinta", hex: "#18352F", text: "#F5F7F2" },
  { name: "Musgo", hex: "#52665F", text: "#F5F7F2" },
  { name: "Latão", hex: "#D9A84E", text: "#18352F" },
];

export default function BrandbookPage() {
  return (
    <main className="min-h-screen bg-[#F5F7F2] px-5 py-10 text-[#18352F] print:p-0">
      <div className="mx-auto max-w-4xl space-y-8 print:max-w-none print:space-y-0">
        <section className="flex min-h-[72vh] flex-col items-center justify-center rounded-3xl border border-[#DDE8E0] bg-[#F5F7F2] px-8 py-16 text-center shadow-sm print:min-h-0 print:h-[260mm] print:break-after-page print:rounded-none print:border-0 print:bg-[#F5F7F2] print:shadow-none">
          <Logo size={150} decorative className="mb-8" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#52665F]">
            Identidade de marca
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">
            Guia de Marca
            <span className="mt-2 block text-[#164E45]">Prumo</span>
          </h1>
          <p className="mt-6 font-display text-2xl italic text-[#52665F]">
            O GPS do seu TCC.
          </p>
          <p className="mt-16 text-sm text-[#52665F]">Versão oficial · 2026</p>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="01" title="A Essência" subtitle="O que o Prumo é" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 print:grid-cols-3">
            <InfoCard title="Propósito">
              Transformar o TCC em passos possíveis, para que o estudante avance
              com clareza, confiança e orgulho.
            </InfoCard>
            <InfoCard title="Arquétipos">
              <strong>O Sábio</strong> orienta com método. <strong>O Cuidador</strong>{" "}
              acolhe sem culpa.
            </InfoCard>
            <InfoCard title="Personalidade">
              <strong>Sereno.</strong> <strong>Prático.</strong>{" "}
              <strong>Encorajador.</strong>
            </InfoCard>
          </div>
          <blockquote className="mt-8 rounded-2xl bg-[#E5EBE4] p-6 font-display text-2xl leading-snug text-[#18352F]">
            “Você cuida do seu TCC; o Prumo cuida do caminho.”
          </blockquote>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="0.2" title="O Logotipo" subtitle="Pêndulo em Movimento" />
          <p className="mt-4 max-w-2xl leading-relaxed text-[#52665F]">
            O Prumo em movimento contínuo. O traço em &apos;S&apos; representa o
            caminho fluido e sem atritos, conectando o peso da ancoragem
            (equilíbrio) à conquista final (a bolinha).
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 print:grid-cols-3">
            <LogoCard label="Cor original" className="bg-[#F5F7F2]">
              <Logo size={92} decorative />
            </LogoCard>
            <LogoCard label="Monocromático · Pinho" className="bg-[#F5F7F2]">
              <Logo size={92} variant="monochrome" decorative />
            </LogoCard>
            <LogoCard label="Invertido · Linho sobre Pinho" className="bg-[#164E45] text-[#F5F7F2]">
              <Logo size={92} variant="inverted" decorative />
            </LogoCard>
          </div>
          <p className="mt-5 text-sm text-[#52665F]">
            Preserve as proporções e as cores do símbolo. Não estique, incline ou
            aplique efeitos que prejudiquem a leitura em tamanhos pequenos.
          </p>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="03" title="Paleta de Cores" subtitle="Eixo Sereno" />
          <p className="mt-4 max-w-2xl leading-relaxed text-[#52665F]">
            O pinho ancora a identidade; o linho cria uma superfície confortável;
            a tinta e o musgo sustentam a leitura; o latão destaca o próximo passo.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5 print:grid-cols-5">
            {colors.map((color) => (
              <div key={color.name} className="break-inside-avoid">
                <div
                  className={`flex aspect-square items-end rounded-2xl p-3 print:rounded-lg ${
                    color.border ? "border border-[#C8D1CA]" : ""
                  }`}
                  style={{ backgroundColor: color.hex, color: color.text }}
                  role="img"
                  aria-label={`${color.name} ${color.hex}`}
                >
                  <span className="text-xs font-semibold">{color.name}</span>
                </div>
                <p className="mt-2 font-mono text-sm font-semibold">{color.hex}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="04" title="Tipografia" subtitle="Clareza para cada escala" />
          <div className="mt-8 grid gap-8 md:grid-cols-2 print:grid-cols-2">
            <div className="break-inside-avoid">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#52665F]">
                Newsreader · Títulos
              </p>
              <p className="font-display text-4xl leading-tight text-[#164E45] sm:text-5xl">
                A clareza abre o caminho.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#52665F]">
                Use em títulos e frases de destaque. A voz editorial acrescenta
                presença sem tirar a serenidade.
              </p>
            </div>
            <div className="break-inside-avoid">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#52665F]">
                Source Sans 3 · Texto corrido
              </p>
              <p className="font-sans text-lg leading-relaxed">
                O Prumo organiza o percurso do TCC e mostra qual é o próximo passo.
                O estudante mantém a autoria do trabalho e avança no próprio ritmo,
                com método e clareza.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#52665F]">
                Use no corpo de texto, formulários, botões, prazos e informações da
                interface. Para números alinhados, prefira algarismos tabulares.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="05" title="Tom de Voz e Vocabulário" subtitle="Um mentor, nunca um cobrador" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 print:grid-cols-2">
            <div className="break-inside-avoid rounded-2xl border border-[#DDE8E0] bg-[#F5F7F2] p-6">
              <h3 className="font-display text-2xl font-semibold text-[#164E45]">
                Use sempre
              </h3>
              <ul className="mt-4 space-y-3">
                {["Respire", "Próximo passo", "Vamos juntos", "No seu ritmo"].map((phrase) => (
                  <li key={phrase} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#D9A84E]" aria-hidden="true" />
                    {phrase}
                  </li>
                ))}
              </ul>
            </div>
            <div className="break-inside-avoid rounded-2xl border border-[#DDE8E0] bg-[#F5F7F2] p-6">
              <h3 className="font-display text-2xl font-semibold text-[#52665F]">
                Nunca use
              </h3>
              <ul className="mt-4 space-y-3">
                {["Urgente!", "Atrasado (como acusação)", "Erro crítico"].map((phrase) => (
                  <li key={phrase} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#52665F]" aria-hidden="true" />
                    {phrase}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 rounded-xl bg-[#E5EBE4] p-5 leading-relaxed">
            Acolha sem julgamento, apresente uma ação possível e reconheça o
            progresso real. O Prumo orienta; o estudante conduz o TCC.
          </p>
        </section>

        <section className="rounded-3xl border border-[#DDE8E0] bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <SectionHeading number="06" title="Aplicações Práticas" subtitle="A identidade em uso" />
          <div className="mt-8 grid gap-6 md:grid-cols-2 print:grid-cols-2">
            <div className="break-inside-avoid rounded-2xl bg-[#F5F7F2] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#52665F]">
                Ação principal
              </p>
              <button
                type="button"
                className="rounded-xl bg-[#164E45] px-5 py-3 font-semibold text-[#F5F7F2] shadow-sm print:shadow-none"
              >
                Ver próxima etapa
              </button>
            </div>
            <div className="break-inside-avoid rounded-2xl border border-[#DDE8E0] bg-[#F5F7F2] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#52665F]">
                Mensagem de erro
              </p>
              <div className="rounded-xl border border-[#C8D1CA] bg-white p-5">
                <p className="font-semibold text-[#18352F]">Ops, o Prumo escorregou aqui.</p>
                <p className="mt-2 text-sm leading-relaxed text-[#52665F]">
                  Seu progresso está salvo. Sem pânico — tente novamente em instantes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-6 text-center text-sm text-[#52665F] print:py-0">
          Prumo · Você cuida do seu TCC; o Prumo cuida do caminho.
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-[#DDE8E0] pb-5">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#52665F]">{number}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-[#164E45] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#52665F]">{subtitle}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-[#DDE8E0] bg-[#F5F7F2] p-5">
      <h3 className="font-display text-xl font-semibold text-[#164E45]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#18352F]">{children}</p>
    </div>
  );
}

function LogoCard({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`break-inside-avoid rounded-2xl p-6 ${className}`}>
      <div className="flex h-32 items-center justify-center">{children}</div>
      <p className="mt-3 text-center text-xs font-semibold">{label}</p>
    </div>
  );
}
