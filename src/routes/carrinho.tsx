import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus, Package } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/data";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/carrinho")({
  component: CartPage,
});

function CartPage() {
  const { items, totalItems, addItem, removeItem, updateQuantity, clearCart } = useCart();

  const cartProducts = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  const total = cartProducts.reduce((sum, p) => sum + p!.price * p!.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Carrinho</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{totalItems} itens</p>
          </div>
          <div className="flex gap-3">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpar carrinho
              </button>
            )}
            <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Continuar comprando
            </Link>
          </div>
        </div>

        {cartProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Adicione produtos para começar</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 font-semibold hover:bg-primary-hover transition-colors"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-4">
              {cartProducts.map((p) => (
                <div
                  key={p!.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <Link to={`/produto/${p!.slug}`} className="shrink-0">
                    <img
                      src={p!.image}
                      alt={p!.name}
                      className="h-24 w-24 rounded-lg object-cover bg-muted"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/produto/${p!.slug}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                    >
                      {p!.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1">{p!.brand}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(p!.id, p!.quantity - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{p!.quantity}</span>
                        <button
                          onClick={() => addItem(p!.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold">
                          R$ {(p!.price * p!.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {p!.price.toFixed(2)}/un
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(p!.id)}
                      className="mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-semibold">Resumo do pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="text-primary font-medium">Calcular no checkout</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <Link
                  to="/checkout"
                  className="block w-full text-center rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:bg-primary-hover transition-colors"
                >
                  Finalizar pedido
                </Link>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  Frete calculado no checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
