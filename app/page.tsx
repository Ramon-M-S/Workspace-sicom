import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  FileJson,
  LayoutDashboard,
  Map,
  UserPlus,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { PublicAuthLink } from "@/components/marketing/public-auth-link";

const features = [
  {
    icon: Map,
    title: "O GPS do TCC",
    description: "O Dashboard foca na única coisa que importa hoje: a sua próxima etapa.",
    tone: "bg-primary/10 text-primary",
  },
  {
    icon: LayoutDashboard,
    title: "Kanban e Roadmap",
    description: "Visualize seu progresso e arraste as tarefas sem estresse.",
    tone: "bg-brass/15 text-foreground",
  },
  {
    icon: FileJson,
    title: "Importação Mágica",
    description: "Cole um script JSON e gere todo o seu cronograma em segundos.",
    tone: "bg-muted text-muted-foreground",
  },
  {
    icon: Bell,
    title: "Lembretes Serenos",
    description: "Avisos por e-mail que te ajudam a avançar, sem gerar pânico.",
    tone: "bg-muted text-muted-foreground",
  },
];

const steps = [
  { icon: UserPlus, number: "01", title: "Crie sua conta", text: "Seu espaço para organizar as ideias e começar com calma." },
  { icon: CalendarDays, number: "02", title: "Organize seu cronograma", text: "Distribua etapas e prazos de um jeito que faça sentido para você." },
  { icon: CheckCircle2, number: "03", title: "Siga o próximo passo", text: "Avance uma tarefa por vez e acompanhe o caminho ganhar forma." },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Prumo, página inicial" className="flex items-center gap-2.5">
          <Logo size={36} />
          <span className="font-display text-2xl font-semibold tracking-tight">Prumo</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm font-semibold text-muted-foreground md:flex">
          <a className="transition-colors hover:text-primary" href="#funcionalidades">Funcionalidades</a>
          <a className="transition-colors hover:text-primary" href="#como-funciona">Como funciona</a>
        </nav>
        <PublicAuthLink className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-card" />
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 md:grid-cols-2 md:py-20 lg:gap-16 lg:px-12 lg:pb-28">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-brass" /> UM CAMINHO MAIS LEVE PARA O SEU TCC
          </div>
          <h1 className="max-w-2xl font-display text-5xl font-medium leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem]">
            Seu TCC tem um caminho. <span className="text-primary">O Prumo te mostra o próximo passo.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Transforme a montanha do TCC em passos possíveis. Organize suas etapas, prazos e anotações sem culpa e com total clareza.
          </p>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 font-semibold text-background shadow-sm transition hover:bg-muted">
              Começar agora <ArrowRight size={17} />
            </Link>
            <a href="#como-funciona" className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-muted-foreground transition hover:bg-card/70">
              Ver como funciona <ArrowRight size={16} />
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[
                "bg-muted",
                "bg-muted",
                "bg-muted",
                "bg-muted",
              ].map((color, index) => <span key={index} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-border ${color} text-[10px] font-bold text-muted-foreground`}>{["M", "A", "J", "L"][index]}</span>)}
            </div>
            <span>Um passo de cada vez. Você consegue.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] py-8 sm:py-10">
          <div className="absolute inset-x-8 inset-y-5 rounded-[3rem] bg-muted" />
          <div className="relative rounded-[2rem] border border-white/80 bg-card p-5 shadow-[0_24px_70px_-30px_rgba(24,53,47,0.28)] sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">QUARTA-FEIRA, 14 DE MAIO</p>
                <p className="mt-1 font-display text-2xl text-foreground">Seu espaço de hoje</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground"><CalendarDays size={18} /></div>
            </div>
            <div className="mt-5 rounded-2xl bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>SEU PROGRESSO</span><span>58%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[58%] rounded-full bg-muted" /></div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Revisão da literatura</span><span>7 de 12 etapas</span></div>
            </div>
            <div className="mt-5 rounded-2xl border border-border p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Check size={19} strokeWidth={2.5} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PRÓXIMA ETAPA</p>
                  <p className="mt-1 font-display text-xl text-foreground">Escrever introdução</p>
                  <p className="mt-1 text-sm text-muted-foreground">Um bom começo, no seu ritmo.</p>
                </div>
                <span className="rounded-full bg-brass/15 px-2.5 py-1 text-xs font-semibold text-foreground">Hoje</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary p-4 text-background">
                <p className="text-xs text-primary-foreground/70">SUA DEFESA</p>
                <p className="mt-1 font-display text-3xl">426 <span className="font-sans text-sm">dias</span></p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">ANOTAÇÕES</p>
                <p className="mt-1 font-display text-3xl text-foreground">12 <span className="font-sans text-sm">ideias</span></p>
              </div>
            </div>
            <div className="absolute -right-3 top-24 hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground shadow-lg sm:flex lg:-right-8">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground"><Check size={14} /></span> Etapa concluída!
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:block lg:-left-8">
            <p className="text-xs text-muted-foreground">HOJE, NO SEU RITMO</p><p className="mt-1 font-display text-lg text-foreground">Só mais um passo 🌱</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted" aria-label="Validação">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 px-5 py-7 text-center sm:px-8 md:flex-row md:gap-12 lg:px-12">
          <p className="text-sm font-semibold text-muted-foreground">Validado por estudantes do IFMA</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold tracking-wide text-muted-foreground">
            <span className="font-display text-lg">IFMA</span><span className="text-xs">INSTITUTO FEDERAL</span><span className="font-display text-lg">Educação que transforma</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brass" /> Pesquisa &amp; futuro</span>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="scroll-mt-8 mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">CLAREZA PARA CADA ETAPA</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">Tudo o que você precisa para não se perder.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-muted-foreground">Menos peso na cabeça, mais espaço para o que importa: fazer seu trabalho avançar.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {features.map(({ icon: Icon, title, description, tone }, index) => (
            <article key={title} className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[0_14px_36px_-24px_rgba(24,53,47,0.3)] sm:p-8">
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon size={22} strokeWidth={1.8} /></div>
                <span className="font-display text-sm text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-2xl text-foreground">{title}</h3>
              <p className="mt-2 max-w-md leading-7 text-muted-foreground">{description}</p>
              <div className="mt-6 h-px w-full bg-muted transition-colors group-hover:bg-muted" />
              <a href="#como-funciona" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">Saiba mais <ArrowRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-8 bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">SIMPLES ASSIM</p>
            <h2 className="mt-4 font-display text-4xl text-foreground sm:text-5xl">Como o Prumo funciona.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Um caminho claro, construído passo a passo.</p>
          </div>
          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="absolute left-[17%] right-[17%] top-9 hidden border-t-2 border-dashed border-border md:block" />
            {steps.map(({ icon: Icon, number, title, text }) => (
              <article key={number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.5rem] border border-border bg-background text-muted-foreground shadow-sm"><Icon size={24} strokeWidth={1.7} /></div>
                <span className="mt-5 text-xs font-bold tracking-[0.16em] text-muted-foreground">PASSO {number}</span>
                <h3 className="mt-2 font-display text-2xl text-foreground">{title}</h3>
                <p className="mt-2 max-w-xs leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-background sm:px-12 sm:py-16 lg:px-20">
          <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -left-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">SEU PRÓXIMO PASSO COMEÇA AQUI</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Pronto para colocar o TCC no prumo?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-primary-foreground/75">Junte-se aos estudantes que estão trocando o pânico pelo progresso sustentável.</p>
            <Link href="/registro" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass px-8 py-3.5 font-semibold text-primary transition-colors hover:bg-muted">Criar minha conta <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} /><span className="font-display text-xl font-semibold">Prumo</span>
          </Link>
          <p className="text-sm text-muted-foreground">Você cuida do seu TCC; o Prumo cuida do caminho.</p>
          <div className="flex items-center gap-5 text-sm font-semibold text-muted-foreground"><Link href="/login" className="hover:text-primary">Entrar</Link><Link href="/registro" className="hover:text-primary">Criar conta</Link></div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Prumo. Feito para avançar com clareza.</div>
      </footer>
    </main>
  );
}
