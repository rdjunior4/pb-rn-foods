import { MapPin, Phone, Mail, Clock, Instagram, Youtube, Linkedin, ChevronRight } from "lucide-react";
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

export function Footer() {
  const { data: categories = [] } = useCategories();
  return (
    <footer className="mt-20 bg-brand-black">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 py-14 lg:py-20">
          <div className="lg:col-span-3">
            <Link to="/">
              <Logo className="h-14" />
            </Link>
            <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-xs">
              Distribuidora de alimentos com foco em atender empresas com variedade,
              qualidade e condições especiais para seu negócio crescer.
            </p>
            <div className="mt-7 space-y-3.5 text-sm">
              <a href="tel:83999999999" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </span>
                (83) 99999-9999
              </a>
              <a href="mailto:contato@pbrnfoods.com.br" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </span>
                contato@pbrnfoods.com.br
              </a>
              <span className="flex items-center gap-3 text-white/60 group">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <MapPin className="h-4 w-4 text-primary" />
                </span>
                João Pessoa - PB
              </span>
              <span className="flex items-center gap-3 text-white/60">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <Clock className="h-4 w-4 text-primary" />
                </span>
                Seg a Sex: 6h - 18h | Sáb: 6h - 12h
              </span>
            </div>
            <div className="flex items-center gap-2 mt-8">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href === "#" ? undefined : "_blank"}
                  rel={s.href === "#" ? undefined : "noopener noreferrer"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 text-white/40 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold text-sm mb-5">Categorias</h4>
            <ul className="space-y-3">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to="/categoria/$slug" params={{ slug: c.slug }} className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                    <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold text-sm mb-5">Ajuda & Suporte</h4>
            <ul className="space-y-3">
              {helpers.map((h) => (
                <li key={h.label}>
                  <Link to="/pagina/$slug" params={{ slug: h.slug }} className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                    <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                    {h.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold text-sm mb-5">Para seu negócio</h4>
            <ul className="space-y-3">
              {business.map((b) => (
                <li key={b.label}>
                  <Link to={b.to} search={"search" in b ? b.search : undefined} className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                    <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} PB&RN Foods. Todos os direitos reservados.</span>
          <span>CNPJ: 00.000.000/0001-00</span>
        </div>
      </div>
    </footer>
  );
}