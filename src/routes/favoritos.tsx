import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/hooks";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/favoritos")({
  component: FavoritosPage,
});

function FavoritosPage() {
  const { items, toggleFavorite } = useWishlist();
  const { addItem } = useCart();
  const { data: products = [] } = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const favProducts = items
    .map((id) => productMap.get(id))
    .filter(Boolean);

  return (
    <CustomerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lista de desejos</h1>
        <p className="text-muted-foreground text-sm mt-1">{favProducts.length} {favProducts.length === 1 ? "produto salvo" : "produtos salvos"}</p>
      </div>

      {favProducts.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-rose-100/50 mb-8">
            <Heart className="h-12 w-12 text-rose-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sua lista está vazia</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Adicione produtos favoritos para encontrá-los facilmente quando precisar.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-8 py-3.5 font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Explorar produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favProducts.map((p) => (
            <div key={p!.id} className="group rounded-lg border border-border/40 bg-card p-5 hover:shadow-md transition-all">
              <div className="flex gap-4">
                <Link to="/produto/$slug" params={{ slug: p!.slug }} className="shrink-0">
                  <img
                    src={p!.image}
                    alt={p!.name}
                    className="h-28 w-28 rounded-lg object-cover bg-muted group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: p!.slug }}
                    className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                  >
                    {p!.name}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">{p!.brand}</div>
                  <div className="text-xl font-extrabold mt-3 tracking-tight">{formatCurrency(p!.price)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                <button
                  onClick={() => {
                    addItem(p!.id);
                    toast.success(`${p!.name} adicionado ao carrinho`);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:bg-primary-hover transition-colors"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Adicionar ao carrinho
                </button>
                <button
                  onClick={() => {
                    toggleFavorite(p!.id);
                    toast.success("Removido dos favoritos");
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/40 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}
