const brands = [
  { name: "Nestlé", style: "font-serif italic" },
  { name: "Seara", style: "font-bold text-primary" },
  { name: "Pilão", style: "font-black" },
  { name: "Aurora", style: "font-bold" },
  { name: "Camponesa", style: "font-bold tracking-wider" },
  { name: "Hemmer", style: "font-extrabold" },
  { name: "Bauducco", style: "font-bold italic text-primary" },
  { name: "Yoki", style: "font-black" },
];

export function BrandHighlights() {
  // Duplicate list to create seamless infinite loop
  const loop = [...brands, ...brands];

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-bold">Marcas em destaque</h2>
        <a href="#" className="text-sm font-semibold text-primary hover:underline">
          Ver todas as marcas
        </a>
      </div>

      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex w-max gap-3 animate-marquee group-hover:[animation-play-state:paused]">
          {loop.map((b, i) => (
            <div
              key={`${b.name}-${i}`}
              className="flex h-24 w-44 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:border-primary transition-colors"
            >
              <span className={`text-lg ${b.style}`}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
