import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAdminStore, useStoreConfig } from "@/lib/hooks";
import { dispatchAuthModalEvent } from "@/lib/events";
import defaultHeroImg from "@/assets/hero-warehouse.jpg";
import type { Banner } from "@/lib/types";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function HeroBanner() {
  const { data: store } = useAdminStore();
  const { data: config } = useStoreConfig();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (store?.banners) {
      setBanners(store.banners.sort((a, b) => a.order - b.order));
    }
  }, [store?.banners]);

  if (config && !config.heroEnabled) return null;

  const carouselEnabled = config?.carouselEnabled ?? true;
  const carouselInterval = config?.carouselInterval ?? 6000;
  const heroTitle = config?.heroTitle ?? "P&B RN Foods — Atacado e Distribuidora";
  const heroSubtitle = config?.heroSubtitle ?? "Produtos de qualidade com os melhores preços para o seu negócio";
  const heroCtaText = config?.heroCtaText ?? "Explorar catálogo";
  const heroCtaLink = config?.heroCtaLink ?? "/buscar";
  const heroSecondaryCtaEnabled = config?.heroSecondaryCtaEnabled ?? true;

  const activeBanners = banners.filter((b) => b.active);
  const shouldCarousel = carouselEnabled && activeBanners.length > 1;
  const displayBanner =
    activeBanners.length > 0 ? (shouldCarousel ? activeBanners[current] : activeBanners[0]) : null;

  const showTitle = displayBanner ? displayBanner.showTitle !== false : true;
  const showSubtitle = displayBanner ? displayBanner.showSubtitle !== false : true;
  const showCta = displayBanner ? displayBanner.showCta !== false : true;

  const hasTitle = showTitle && (displayBanner?.title || heroTitle);
  const hasSubtitle = showSubtitle && (displayBanner?.subtitle || heroSubtitle);
  const hasCta = displayBanner ? displayBanner.showCta !== false : true;
  const hasSecondaryCta = heroSecondaryCtaEnabled;

  const hasAnyText = hasTitle || hasSubtitle || hasCta || hasSecondaryCta;

  const nextSlide = () => setCurrent((prev) => (prev + 1) % Math.max(activeBanners.length, 1));
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + activeBanners.length) % Math.max(activeBanners.length, 1));

  return (
    <section className="w-full mx-auto max-w-[1400px]">
      <AutoCarousel
        enabled={shouldCarousel}
        interval={carouselInterval}
        onNext={nextSlide}
      />
      <div className="group relative overflow-hidden bg-brand-black min-h-[260px] sm:min-h-[350px] lg:h-[450px] sm:max-h-none flex items-center rounded-lg">
        <img
          src={(isMobile && displayBanner?.mobileImage) ? displayBanner.mobileImage : (displayBanner?.image || defaultHeroImg)}
          alt={displayBanner?.title || ""}
          className={`absolute inset-0 h-full w-full object-cover ${
            hasAnyText ? "opacity-40" : "opacity-100"
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultHeroImg;
          }}
        />
        {hasAnyText && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black/95 via-brand-black/70 to-brand-black/10" />
        )}

        {hasAnyText && (
          <div className="relative z-10 w-full mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] py-10 sm:py-14 lg:py-16">
            {hasTitle && (
              <h1 className="max-w-[85%] sm:max-w-[45%] text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight text-white">
                {displayBanner?.title || heroTitle}
              </h1>
            )}

            {hasSubtitle && (
              <p className="mt-4 max-w-xl text-sm sm:text-base text-white/60 leading-relaxed">
                {displayBanner?.subtitle || heroSubtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {hasCta && (
                <Link
                  to={(displayBanner?.link || heroCtaLink || "/buscar") as any}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover transition-all text-primary-foreground font-semibold rounded px-6 py-3 text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                >
                  {displayBanner?.ctaText || heroCtaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {hasSecondaryCta && (
                <button
                  onClick={() => dispatchAuthModalEvent(true, "register")}
                  className="inline-flex items-center gap-2 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium rounded px-6 py-3 text-sm backdrop-blur-sm"
                >
                  Cadastre-se CNPJ
                </button>
              )}
            </div>
          </div>
        )}

        {shouldCarousel && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60 hover:text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60 hover:text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function AutoCarousel({
  enabled,
  interval,
  onNext,
}: {
  enabled: boolean;
  interval: number;
  onNext: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(onNext, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, onNext]);
  return null;
}
