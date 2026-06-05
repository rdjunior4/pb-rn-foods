import { createFileRoute, Link } from "@tanstack/react-router";
import { getCategoryBySlug, getProductsByCategory, categories } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/categoria/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">Voltar ao início</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const products = getProductsByCategory(category.id);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category.name}</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
