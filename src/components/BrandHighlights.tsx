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
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-bold">Marcas em destaque</h2>
        <a href="#" className="text-sm font-semibold text-primary hover:underline">
          Ver todas as marcas
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {brands.map((b) => (
          <div
            key={b.name}
            className="flex h-24 items-center justify-center rounded-xl border border-border bg-card hover:border-primary transition-colors"
          >
            <span className={`text-lg ${b.style}`}>{b.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
