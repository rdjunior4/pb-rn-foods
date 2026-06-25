import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useProducts } from "@/lib/hooks";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  const productMap = new Map(products.map((p) => [p.id, p]));

  const total = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleClear = () => {
    clearCart();
    toast.success("Carrinho limpo");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md bg-background/95 backdrop-blur-xl p-0">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/60 mb-5">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="font-semibold text-foreground text-lg">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-8 max-w-[200px]">
              Adicione produtos para começar sua compra
            </p>
            <SheetClose asChild>
              <button className="inline-flex items-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold px-8 text-sm hover:bg-primary-hover transition-all">
                Continuar comprando
              </button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="absolute -top-2 -right-2 inline-flex h-4 min-w-[14px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                    {totalQuantity > 99 ? "99+" : totalQuantity}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-primary">Carrinho</span>
                  <span className="text-xs text-muted-foreground/60 ml-2">
                    {totalItems} {totalItems === 1 ? "produto" : "produtos"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="text-[11px] text-muted-foreground/50 hover:text-primary font-medium transition-colors"
                >
                  Limpar
                </button>
                <SheetClose className="rounded-full p-1.5 hover:bg-primary/10 transition-colors">
                  <X className="h-4 w-4" />
                </SheetClose>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => {
                const product = productMap.get(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    className="group flex gap-3 rounded border border-border/40 bg-card p-3 transition-all hover:border-border/80 hover:shadow-sm"
                  >
                    <div className="h-20 w-20 shrink-0 rounded bg-muted/50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{product.name}</h4>
                        <button
                          onClick={() => {
                            removeItem(item.productId);
                            toast.success(`${product.name} removido`);
                          }}
                          className="p-0.5 text-muted-foreground/20 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground/50 mt-0.5">{product.brand}</div>
<div className="text-xs text-muted-foreground/40 mt-0.5 font-mono">
                         {formatCurrency(product.price * item.quantity)}
                       </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center border border-border/40 rounded overflow-hidden">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeItem(item.productId);
                              } else {
                                updateQuantity(item.productId, item.quantity - 1);
                              }
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center hover:bg-primary/10 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold border-x border-border/40">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="inline-flex h-7 w-7 items-center justify-center hover:bg-primary/10 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[11px] text-muted-foreground/40">
                          {formatCurrency(product.price)} un.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/40 px-6 py-5 space-y-4 bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground/40">
                  <span>{totalQuantity} {totalQuantity === 1 ? "item" : "itens"}</span>
                  <span>Frete calculado no checkout</span>
                </div>
              </div>
              <button
                onClick={() => { onOpenChange(false); navigate({ to: "/checkout" }); }}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Ir para o checkout
                <ArrowRight className="h-4 w-4" />
              </button>
              <SheetClose asChild>
                <button className="w-full text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors text-center">
                  Continuar comprando
                </button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
