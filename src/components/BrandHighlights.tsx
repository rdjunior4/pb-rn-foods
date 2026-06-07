import { Link } from "@tanstack/react-router";
import { brands } from "@/lib/data";

export function BrandHighlights() {
  const loop = [...brands, ...brands];

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Marcas em destaque</h2>
        <Link to="/buscar" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          Ver todas →
        </Link>
      </div>
      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex w-max gap-4 animate-marquee">
          {loop.map((b, i) => (
            <Link
              key={`${b.name}-${i}`}
              to="/buscar"
              search={{ q: b.name }}
              className="flex h-20 w-40 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all p-4"
            >
              <img
                src={b.logo}
                alt={b.name}
                className="h-full w-full object-contain md:grayscale md:hover:grayscale-0 transition-all"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
