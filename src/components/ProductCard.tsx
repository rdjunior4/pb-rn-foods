import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useNavigate } from "@tanstack/react-router";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, getItemQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const navigate = useNavigate();

  const qty = getItemQuantity(product.id);
  const favorite = isFavorite(product.id);
  const hasDiscount = product.discount && product.discount > 0;

  return (
    <div
      onClick={() => navigate({ to: `/produto/${product.slug}` })}
      className="group relative flex flex-col rounded border border-border/40 bg-card shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="inline-flex items-center rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
            -{product.discount}%
          </span>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute top-2.5 right-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all shadow-sm active:scale-90 md:opacity-0 md:group-hover:opacity-100"
      >
        <Heart className={`h-4 w-4 transition-colors ${favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
      </button>

      <div className="relative flex h-40 sm:h-44 items-center justify-center bg-gradient-to-b from-muted/30 to-muted/50 rounded-t mb-3 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 md:group-hover:bg-black/10 transition-colors duration-300">
          <span className="rounded-full bg-white/90 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-lg md:translate-y-2 md:group-hover:translate-y-0">
            <Eye className="h-4 w-4 text-foreground" />
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-3 sm:px-4 pb-3 sm:pb-4">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="mt-1 text-[11px] text-muted-foreground">{product.brand}</div>

        <div className="mt-auto flex items-end justify-between pt-3 border-t border-border/40">
          <div>
            {product.oldPrice && (
              <div className="text-[11px] text-muted-foreground line-through">
                {formatCurrency(product.oldPrice)}
              </div>
            )}
            <div className="text-base font-extrabold text-foreground tracking-tight">
              {formatCurrency(product.price)}
              <span className="text-[10px] font-medium text-muted-foreground ml-0.5">
                /{product.unit}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); addItem(product.id); }}
            aria-label="Adicionar ao carrinho"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover active:scale-90 transition-all shadow-sm hover:shadow-md hover:shadow-primary/20"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
          </button>
        </div>

        {qty > 0 && (
          <div className="absolute bottom-[68px] right-3 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">
            {qty} no carrinho
          </div>
        )}
      </div>
    </div>
  );
}