import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2, ChevronLeft, Loader2, LogIn } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useProducts } from "@/lib/hooks";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Lista de Desejos | PB&RN Foods" },
      { name: "description", content: "Veja seus produtos favoritos salvos na PB&RN Foods." },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { user } = useAuth();
  const { items, toggleFavorite } = useWishlist();
  const { addItem } = useCart();
  const { data: products = [], isLoading } = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (!user) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
              <Heart className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground mb-6">Faça login para ver seus favoritos.</p>
            <Link to="/minha-conta" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all">
              <LogIn className="h-4 w-4" /> Ir para Minha Conta
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  const favProducts = items
    .map((id) => productMap.get(id))
    .filter(Boolean);

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ChevronLeft className="h-3 w-3" /> Minha conta
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight">Lista de desejos</h1>
            <p className="text-sm text-muted-foreground mt-1">{favProducts.length} {favProducts.length === 1 ? "produto salvo" : "produtos salvos"}</p>
          </div>
        </div>

        {favProducts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <Heart className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold mb-1">Nenhum produto favoritado</p>
            <p className="text-xs text-muted-foreground mb-5">Adicione produtos aos favoritos para encontrá-los facilmente.</p>
            <Link to="/" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all">
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favProducts.map((p) => (
              <div key={p!.id} className="group rounded-xl border border-border/40 bg-card p-4 sm:p-5 hover:shadow-md transition-all">
                <div className="flex gap-4">
                  <Link to="/produto/$slug" params={{ slug: p!.slug }} className="shrink-0">
                    <img
                      src={p!.image}
                      alt={p!.name}
                      className="h-20 w-20 sm:h-28 sm:w-28 rounded-lg object-cover bg-muted group-hover:scale-105 transition-transform duration-300"
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary-hover transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Adicionar ao carrinho
                  </button>
                  <button
                    onClick={() => {
                      toggleFavorite(p!.id);
                      toast.success("Removido dos favoritos");
                    }}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
