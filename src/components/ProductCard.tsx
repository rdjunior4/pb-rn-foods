import { ShoppingCart } from "lucide-react";

export interface Product {
  name: string;
  oldPrice: string;
  price: string;
  unit: string;
  discount: string;
  emoji: string;
}

export function ProductCard({ p }: { p: Product }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all">
      <span className="absolute top-3 left-3 z-10 inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
        {p.discount}
      </span>

      <div className="flex h-36 items-center justify-center bg-muted/40 rounded-lg mb-4 text-6xl">
        <span aria-hidden>{p.emoji}</span>
      </div>

      <h3 className="text-sm font-semibold leading-snug min-h-[2.5rem]">
        {p.name}
      </h3>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs text-muted-foreground line-through">
            R$ {p.oldPrice}
          </div>
          <div className="text-lg font-extrabold text-foreground">
            R$ {p.price}
            <span className="text-xs font-medium text-muted-foreground">
              {" "}/{p.unit}
            </span>
          </div>
        </div>
        <button
          aria-label="Adicionar ao carrinho"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow"
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
