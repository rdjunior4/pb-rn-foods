import { MapPin, Phone, Mail, Clock, Instagram, Youtube, Linkedin, ChevronRight, MessageCircle, Shield, Truck, CreditCard, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useCategories } from "@/lib/hooks";

const helpers = [
  { label: "Sobre nós", slug: "sobre" },
  { label: "Perguntas frequentes", slug: "faq" },
  { label: "Termos e condições", slug: "termos" },
  { label: "Política de privacidade", slug: "privacidade" },
  { label: "Troca e devolução", slug: "troca-e-devolucao" },
];

const business = [
  { label: "Cadastro CNPJ", to: "/entrar", search: { tab: "register" as const, redirect: "/" } },
  { label: "Compras no atacado", to: "/buscar", search: { q: "atacado" } },
  { label: "Lista de desejos", to: "/favoritos" },
  { label: "Minha conta", to: "/minha-conta" },
];

const social = [
  { icon: Instagram, href: "https://www.instagram.com/pbfoodsdistribuidora/", label: "Instagram" },
  { icon: Youtube, href: "https://www.youtube.com/watch?v=tlER4WXP6CU", label: "Youtube" },
  { icon: Linkedin, href: "https://uk.linkedin.com/company/pb-foods", label: "LinkedIn" },
];

const trustBadges = [
  { icon: Truck, label: "Entrega rapida" },
  { icon: Shield, label: "Compra segura" },
  { icon: CreditCard, label: "Pix & cartao" },
  { icon: FileText, label: "Nota fiscal" },
];

export function Footer() {
  const { data: categories = [] } = useCategories();
  return (
    <footer className="mt-20">
      {/* ── Trust Bar ── */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center justify-center gap-2.5 text-sm font-medium text-white/70">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                  <b.icon className="h-4.5 w-4.5 text-primary" />
                </span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-brand-black">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 py-12 lg:py-16">
            {/* ── Brand + Contact ── */}
            <div className="lg:col-span-4">
              <Link to="/">
                <Logo className="h-14" />
              </Link>
              <p className="mt-5 text-sm text-white/50 leading-relaxed max-w-xs">
                Distribuidora de alimentos com foco em atender empresas com variedade,
                qualidade e condicoes especiais para seu negocio crescer.
              </p>

              <div className="mt-7 space-y-3 text-sm">
                <a href="tel:83999999999" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </span>
                  (83) 99999-9999
                </a>
                <a href="https://wa.me/5583999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </span>
                  WhatsApp
                </a>
                <a href="mailto:contato@pbrnfoods.com.br" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </span>
                  contato@pbrnfoods.com.br
                </a>
                <span className="flex items-center gap-3 text-white/60">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  Joao Pessoa - PB
                </span>
                <span className="flex items-center gap-3 text-white/60">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-xs sm:text-sm">Seg a Sex: 6h - 18h | Sab: 6h - 12h</span>
                </span>
              </div>

              <div className="flex items-center gap-2 mt-7">
                {social.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Categories ── */}
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">Categorias</h4>
              <ul className="space-y-3">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link to="/categoria/$slug" params={{ slug: c.slug }} className="group inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Help ── */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">Ajuda & Suporte</h4>
              <ul className="space-y-3">
                {helpers.map((h) => (
                  <li key={h.label}>
                    <Link to="/pagina/$slug" params={{ slug: h.slug }} className="group inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                      {h.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Business ── */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">Para seu negocio</h4>
              <ul className="space-y-3">
                {business.map((b) => (
                  <li key={b.label}>
                    <Link to={b.to} search={"search" in b ? b.search : undefined} className="group inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bg-black/40 border-t border-white/5">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
          <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>&copy; {new Date().getFullYear()} PB&RN Foods. Todos os direitos reservados.</span>
              <span className="hidden sm:inline">|</span>
              <span>CNPJ: 00.000.000/0001-00</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-white/5">
                <Shield className="h-3 w-3 text-emerald-400" />
                Site Seguro
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-white/5">
                <CreditCard className="h-3 w-3 text-primary" />
                Pix & Cartao
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
