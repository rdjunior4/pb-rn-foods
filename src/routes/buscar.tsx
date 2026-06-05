import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { searchProducts, categories } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/buscar")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);

  const results = q ? searchProducts(q) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate({ to: "/buscar", search: { q: query.trim() } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos, marcas..."
              className="w-full h-12 rounded-xl border border-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </form>

        {q && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              {results.length} resultado{results.length !== 1 ? "s" : ""} para "<strong className="text-foreground">{q}</strong>"
            </span>
          </div>
        )}

        {!q && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold">Busque por produtos ou marcas</h2>
            <p className="text-sm text-muted-foreground mt-1">Encontre o que precisa para seu negócio</p>
          </div>
        )}

        {q && results.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold">Nenhum resultado encontrado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar por outro termo ou navegue pelas categorias
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
