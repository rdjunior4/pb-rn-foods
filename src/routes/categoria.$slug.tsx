import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProductsByCategory, useCategories } from "@/lib/hooks";
import { ProductCard } from "@/components/ProductCard";
import { CustomerLayout } from "@/components/CustomerLayout";
import { ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from "lucide-react";
import { ITEMS_PER_PAGE, SELECT_CLASSES } from "@/lib/constants";

export const Route = createFileRoute("/categoria/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: categories = [] } = useCategories();
  const category = categories.find((c) => c.slug === slug);
  const { data: products = [], isLoading } = useProductsByCategory(category?.id || "");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "name">("default");

  if (isLoading) {
    return (
      <CustomerLayout maxWidth="1400">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando produtos...</span>
        </div>
      </CustomerLayout>
    );
  }

  if (!category) {
    return (
      <CustomerLayout maxWidth="1400">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            Voltar ao início
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  let sortedProducts = [...products];

  if (sort === "price-asc") sortedProducts.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") sortedProducts.sort((a, b) => b.price - a.price);
  else if (sort === "name") sortedProducts.sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paged = sortedProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <CustomerLayout maxWidth="1400">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{sortedProducts.length} produtos</p>
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

      {sortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
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
