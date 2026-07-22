import { MapPin, Phone, Mail, Clock, Instagram, Youtube, Linkedin, ChevronRight, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useCategories, useStoreConfig } from "@/lib/hooks";
import { dispatchAuthModalEvent } from "@/lib/events";

const helpers = [
  { label: "Sobre nós", slug: "sobre" },
  { label: "Perguntas frequentes", slug: "faq" },
  { label: "Termos e condições", slug: "termos" },
  { label: "Política de privacidade", slug: "privacidade" },
  { label: "Troca e devolução", slug: "troca-e-devolucao" },
];

const business = [
  { label: "Cadastro CNPJ", action: () => dispatchAuthModalEvent(true, "register") },
  { label: "Compras no atacado", to: "/buscar", search: { q: "atacado" } },
  { label: "Lista de desejos", to: "/favoritos" },
  { label: "Minha conta", to: "/minha-conta" },
];

export function Footer() {
  const { data: categories = [] } = useCategories();
  const { data: config } = useStoreConfig();

  const social = [
    ...(config?.footerSocialInstagram ? [{ icon: Instagram, href: config.footerSocialInstagram, label: "Instagram" }] : []),
    ...(config?.footerSocialYoutube ? [{ icon: Youtube, href: config.footerSocialYoutube, label: "Youtube" }] : []),
    ...(config?.footerSocialLinkedin ? [{ icon: Linkedin, href: config.footerSocialLinkedin, label: "LinkedIn" }] : []),
  ];

  return (
    <footer className="mt-20 bg-brand-black">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-10 py-10 lg:py-20">
          <div className="lg:col-span-3">
            <Link to="/">
              <Logo className="h-14" />
            </Link>
            <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-xs">
              {config?.footerDescription || "Distribuidora de alimentos para o seu negócio"}
            </p>
            <div className="mt-7 space-y-3.5 text-sm">
              {config?.footerPhone && (
                <a href={`tel:${config.footerPhone.replace(/\D/g, "")}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                  </span>
                  {config.footerPhone}
                </a>
              )}
              {config?.footerWhatsApp && (
                <a href={`https://wa.me/${config.footerWhatsApp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </span>
                  WhatsApp
                </a>
              )}
              {config?.footerEmail && (
                <a href={`mailto:${config.footerEmail}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </span>
                  {config.footerEmail}
                </a>
              )}
              {config?.footerAddress && (
                <span className="flex items-center gap-3 text-white/60 group">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  {config.footerAddress}
                </span>
              )}
              {config?.footerHours && (
                <span className="flex items-center gap-3 text-white/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Clock className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-xs sm:text-sm">{config.footerHours}</span>
                </span>
              )}
            </div>
            {social.length > 0 && (
              <div className="flex items-center gap-2 mt-8">
                {social.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 text-white/40 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
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
                  {"action" in b ? (
                    <button onClick={b.action} className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                      {b.label}
                    </button>
                  ) : (
                    <Link to={b.to!} search={"search" in b ? b.search : undefined} className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary/0 group-hover:text-primary transition-all" />
                      {b.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} {config?.storeName || "PB&RN Foods"}. Todos os direitos reservados.</span>
          {config?.footerCnpj && <span>CNPJ: {config.footerCnpj}</span>}
        </div>
      </div>
    </footer>
  );
}
