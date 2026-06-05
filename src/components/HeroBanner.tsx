import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import defaultHeroImg from "@/assets/hero-warehouse.jpg";

export function HeroBanner() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-6">
      <div className="group relative overflow-hidden rounded-3xl bg-brand-black min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center">
        <img
          src={defaultHeroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/95 via-brand-black/75 to-brand-black/5" />

        <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary backdrop-blur-sm text-xs font-semibold px-3.5 py-1.5 mb-6 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            B2B — Atacado para seu negócio
          </span>

          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
            Abastecimento inteligente para o{" "}
            <span className="text-primary">seu negócio.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg text-white/60 leading-relaxed">
            Variedade, marcas selecionadas e logística eficiente para manter o
            seu negócio sempre abastecido com as melhores condições.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate({ to: "/categoria/mercearia" })}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover transition-all text-primary-foreground font-semibold rounded-xl px-7 py-3.5 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/35 active:scale-[0.98]"
            >
              Explorar catálogo
              <ArrowRight className="h-5 w-5" />
            </button>
            <Link
              to="/entrar"
              className="inline-flex items-center gap-2 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium rounded-xl px-7 py-3.5 text-base backdrop-blur-sm"
            >
              Cadastre-se CNPJ
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" /> Sem taxa de adesão</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" /> Entrega em todo Brasil</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" /> Condições exclusivas para CNPJ</span>
          </div>
        </div>
      </div>
    </section>
  );
}
