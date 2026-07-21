import { Link } from "@tanstack/react-router";
import { useBrands, useStoreConfig } from "@/lib/hooks";

export function BrandHighlights() {
  const { data: allBrands = [] } = useBrands();
  const { data: config } = useStoreConfig();

  const featuredBrandIds = config?.featuredBrandIds ?? [];
  const featured = featuredBrandIds.length > 0
    ? allBrands.filter((b) => featuredBrandIds.includes(b.id) && b.active)
    : allBrands.filter((b) => b.active);

  if (featured.length === 0) return null;

  const loop = [...featured, ...featured];

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Marcas em destaque</h2>
        <Link to="/buscar" search={{ q: "" }} className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          Ver todas →
        </Link>
      </div>
      <div
        className="group overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex w-max gap-4 animate-marquee group-hover:[animation-play-state:paused]">
          {loop.map((b, i) => (
            <Link
              key={`${b.name}-${i}`}
              to="/buscar"
              search={{ q: b.name }}
              className="flex h-24 w-48 shrink-0 items-center justify-center rounded border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all px-3 py-2"
            >
              <img
                src={b.logo}
                alt={b.name}
                className="h-full w-full object-contain grayscale hover:grayscale-0 transition-all"
                loading="lazy"
              />
            </Link>
          ))}
          <Link
            to="/buscar"
            search={{ q: "" }}
            className="flex h-24 w-48 shrink-0 items-center justify-center rounded border border-dashed border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card transition-all px-3 py-2"
          >
            <span className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Ver todas →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
