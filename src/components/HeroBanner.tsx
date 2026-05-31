import { ArrowRight, ShieldCheck, BadgePercent, Truck } from "lucide-react";
import defaultHeroImg from "@/assets/hero-warehouse.jpg";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Marcas selecionadas",
    desc: "Trabalhamos com as melhores marcas do mercado.",
  },
  {
    icon: BadgePercent,
    title: "Condições exclusivas",
    desc: "para CNPJ e clientes recorrentes.",
  },
  {
    icon: Truck,
    title: "Entrega rápida",
    desc: "e cobertura total no Brasil.",
  },
];

export interface HeroBannerProps {
  /** Background image URL. Defaults to the bundled warehouse art. */
  imageUrl?: string;
  /** Alt text for the background image. */
  imageAlt?: string;
  /** Small eyebrow text above the title. */
  eyebrow?: string;
  /** Main headline. Set `showTitle={false}` to hide. */
  title?: React.ReactNode;
  /** Supporting paragraph below the title. */
  subtitle?: string;
  /** CTA button label. */
  ctaLabel?: string;
  /** CTA click handler. */
  onCtaClick?: () => void;
  /** Toggle text block (eyebrow + title + subtitle). Default: true. */
  showTitle?: boolean;
  /** Toggle CTA button. Default: true. */
  showCta?: boolean;
  /** Toggle the right-side benefits column. Default: true. */
  showBenefits?: boolean;
}

/**
 * Hero banner with a configurable background "arte de fundo".
 *
 * The store admin area (to be built later) will be able to upload a background
 * image and choose whether to overlay a title + CTA or show the artwork alone.
 * Pass `showTitle={false}` and `showCta={false}` to render image-only.
 */
export function HeroBanner({
  imageUrl = defaultHeroImg,
  imageAlt = "Arte de fundo do banner",
  eyebrow = "PB&RN FOODS",
  title = (
    <>
      Abastecimento inteligente para o{" "}
      <span className="text-primary">seu negócio.</span>
    </>
  ),
  subtitle = "Variedade, marcas selecionadas e logística eficiente para manter o seu negócio sempre abastecido.",
  ctaLabel = "Explorar catálogo",
  onCtaClick,
  showTitle = true,
  showCta = true,
  showBenefits = true,
}: HeroBannerProps) {
  const hasOverlayContent = showTitle || showCta || showBenefits;
  const imageOnly = !hasOverlayContent;

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-6">
      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-brand-black">
        <img
          src={imageUrl}
          alt={imageAlt}
          width={1600}
          height={800}
          className={
            imageOnly
              ? "block h-auto w-full object-cover"
              : "absolute inset-0 h-full w-full object-cover opacity-60"
          }
        />

        {hasOverlayContent && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-brand-black/30" />

            <div
              className={`relative grid gap-8 p-8 sm:p-12 lg:p-16 ${
                showBenefits && (showTitle || showCta)
                  ? "lg:grid-cols-[1.4fr_1fr]"
                  : "lg:grid-cols-1"
              }`}
            >
              {(showTitle || showCta) && (
                <div className="text-brand-black-foreground">
                  {showTitle && (
                    <>
                      {eyebrow && (
                        <p className="text-primary text-sm font-bold tracking-wider mb-4">
                          {eyebrow}
                        </p>
                      )}
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="mt-6 max-w-xl text-base sm:text-lg text-white/80">
                          {subtitle}
                        </p>
                      )}
                    </>
                  )}
                  {showCta && (
                    <button
                      onClick={onCtaClick}
                      className="mt-8 inline-flex items-center gap-3 bg-primary hover:bg-primary-hover transition-colors text-primary-foreground font-semibold rounded-md px-6 py-3 text-base"
                    >
                      {ctaLabel}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {showBenefits && (
                <div
                  className={`flex flex-col justify-center gap-6 ${
                    showTitle || showCta
                      ? "lg:border-l lg:border-white/15 lg:pl-10"
                      : ""
                  }`}
                >
                  {benefits.map((b, i) => (
                    <div key={b.title} className="flex items-start gap-4">
                      <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                        <b.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-white">
                        <div className="font-semibold">{b.title}</div>
                        <div className="text-sm text-white/70">{b.desc}</div>
                        {i < benefits.length - 1 && (
                          <div className="mt-6 h-px w-32 bg-white/10" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
