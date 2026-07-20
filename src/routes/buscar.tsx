import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from "lucide-react";
import { useSearchProducts, useCategories } from "@/lib/hooks";
import { ProductCard } from "@/components/ProductCard";
import { CustomerLayout } from "@/components/CustomerLayout";
import { ITEMS_PER_PAGE, SELECT_CLASSES } from "@/lib/constants";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar | PB&RN Foods" },
      { name: "description", content: "Busque produtos, marcas e categorias na PB&RN Foods." },
    ],
  }),
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "name">("default");

  const { data: searchResults = [], isLoading } = useSearchProducts(q);
  const { data: categories = [] } = useCategories();

  let results = [...searchResults];

  if (sort === "price-asc") results.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") results.sort((a, b) => b.price - a.price);
  else if (sort === "name") results.sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paged = results.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      navigate({ to: "/buscar", search: { q: query.trim() } });
    }
  };

  return (
    <CustomerLayout maxWidth="1400">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produtos, marcas..."
            className="w-full h-12 rounded border border-border/40 bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </form>

      {isLoading && q && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Buscando...</span>
        </div>
      )}

      {!isLoading && q && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {results.length} resultado{results.length !== 1 ? "s" : ""} para "
              <strong className="text-foreground">{q}</strong>"
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as typeof sort);
                setPage(1);
              }}
              className={SELECT_CLASSES.public}
            >
              <option value="default">Padrão</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>
      )}

      {!q && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold">Busque por produtos ou marcas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Encontre o que precisa para seu negócio
          </p>
        </div>
      )}

      {!isLoading && q && results.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-lg font-semibold">Nenhum resultado encontrado</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar por outro termo ou navegue pelas categorias
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/categoria/$slug"
                params={{ slug: cat.slug }}
                className="inline-flex items-center rounded border border-border/40 px-4 py-1.5 text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-border/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-border/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </CustomerLayout>
  );
}
