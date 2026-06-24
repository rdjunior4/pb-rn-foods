import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus, Package, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/data";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/carrinho")({
  component: CartPage,
});

function CartPage() {
  const { items, totalItems, addItem, removeItem, updateQuantity, clearCart } = useCart();

  const cartProducts = items
    .map((item) => {
      const product = getProductById(item.productId);
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

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="text-center py-24">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted mb-8">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Carrinho vazio</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Adicione produtos para começar suas compras</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-8 py-3.5 font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Explorar produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carrinho</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalItems} {totalItems === 1 ? "item" : "itens"} no carrinho</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-border/40 text-xs font-medium px-4 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-border/40 text-xs font-medium px-4 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continuar
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {cartProducts.map((p) => (
            <div
              key={`${p!.id}-${p!.variantId || ""}`}
              className="group rounded-2xl border border-border/40 bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex gap-4">
                <Link to="/produto/$slug" params={{ slug: p!.slug }} className="shrink-0">
                  <img
                    src={p!.image}
                    alt={p!.name}
                    className="h-28 w-28 rounded-xl object-cover bg-muted group-hover:scale-105 transition-transform duration-300"
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(p!.id, p!.quantity - 1, p!.variantId)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold">{p!.quantity}</span>
                      <button
                        onClick={() => addItem(p!.id, 1, p!.variantId, p!.unitPrice)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 hover:bg-muted transition-colors"
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
          <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
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
              className="block w-full text-center rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
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
    </CustomerLayout>
  );
}
