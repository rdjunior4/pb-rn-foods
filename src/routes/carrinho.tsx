import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus, Package, ArrowRight, Loader2, ChevronLeft, LogIn } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho | PB&RN Foods" },
      { name: "description", content: "Gerencie seus itens no carrinho de compras da PB&RN Foods." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, totalItems, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { data: products = [], isLoading } = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const cartProducts = items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined;
      return {
        ...product,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product.price,
        variantId: item.variantId,
        variantLabel: variant?.label,
      };
    })
    .filter(Boolean);

  const total = cartProducts.reduce((sum, p) => sum + p!.unitPrice * p!.quantity, 0);

  if (!user) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground mb-6">Faça login para acessar seu carrinho.</p>
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

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <ShoppingBag className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold mb-1">Carrinho vazio</p>
            <p className="text-xs text-muted-foreground mb-5">Adicione produtos para começar suas compras.</p>
            <Link to="/" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all">
              Explorar produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ChevronLeft className="h-3 w-3" /> Minha conta
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight">Carrinho</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalItems} {totalItems === 1 ? "item" : "itens"} no carrinho</p>
          </div>
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-border/40 text-xs font-medium px-3 sm:px-4 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {cartProducts.map((p) => (
            <div
              key={`${p!.id}-${p!.variantId || ""}`}
              className="group rounded-lg border border-border/40 bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex gap-4">
                <Link to="/produto/$slug" params={{ slug: p!.slug }} className="shrink-0">
                  <img
                    src={p!.image}
                    alt={p!.name}
                    className="h-20 w-20 sm:h-28 sm:w-28 rounded-lg object-cover bg-muted group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to="/produto/$slug"
                        params={{ slug: p!.slug }}
                        className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                      >
                        {p!.name}
                      </Link>
                      {p!.variantLabel && (
                        <div className="text-xs text-primary font-medium mt-0.5">{p!.variantLabel}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">{p!.brand}</div>
                    </div>
                    <button
                      onClick={() => removeItem(p!.id, p!.variantId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(p!.id, p!.quantity - 1, p!.variantId)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold">{p!.quantity}</span>
                      <button
                        onClick={() => addItem(p!.id, 1, p!.variantId, p!.unitPrice)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold tracking-tight">
                        {formatCurrency(p!.unitPrice * p!.quantity)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(p!.unitPrice)}/un
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Resumo do pedido</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({totalItems} itens)</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-primary font-medium text-xs">Calculado no checkout</span>
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 flex justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-extrabold text-xl tracking-tight">{formatCurrency(total)}</span>
            </div>
            <Link
              to="/checkout"
              className="block w-full text-center rounded-lg bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Finalizar pedido
            </Link>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Package className="h-3.5 w-3.5" />
              Frete calculado no checkout
            </div>
          </div>
        </div>
      </div>
      </div>
    </CustomerLayout>
  );
}
