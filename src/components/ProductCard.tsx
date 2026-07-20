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
      className="group relative flex flex-col rounded-lg border border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* ─── Image ─── */}
      <div className="relative aspect-square bg-gradient-to-b from-muted/20 to-muted/40 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-primary px-1.5 py-[3px] text-[10px] font-bold text-primary-foreground shadow-md">
            -{product.discount}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-sm active:scale-90 md:opacity-0 md:group-hover:opacity-100"
        >
          <Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : "text-zinc-500"}`} />
        </button>

        {/* Hover eye */}
        <div className="absolute inset-0 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <span className="rounded-full bg-white/90 p-2 shadow-lg">
            <Eye className="h-4 w-4 text-zinc-700" />
          </span>
        </div>

        {/* Qty badge */}
        {qty > 0 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-primary/90 backdrop-blur-sm px-1.5 py-[3px] text-[10px] font-bold text-white shadow-md">
            <ShoppingCart className="h-2.5 w-2.5" />
            {qty}
          </span>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3">
        {/* Name + Brand */}
        <div className="min-h-[2.5rem] sm:min-h-[3rem]">
          <h3 className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
              {product.brand}
            </p>
          )}
        </div>

        {/* Price + Cart */}
        <div className="mt-auto pt-2 border-t border-border/40">
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              {product.oldPrice && (
                <div className="text-[10px] text-muted-foreground line-through truncate">
                  {formatCurrency(product.oldPrice)}
                </div>
              )}
              <div className="text-sm sm:text-base font-extrabold text-foreground leading-tight whitespace-nowrap">
                {formatCurrency(product.price)}
                <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground ml-0.5">
                  /{product.unit}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); addItem(product.id); }}
              aria-label="Adicionar ao carrinho"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover active:scale-90 transition-all shadow-sm hover:shadow-md hover:shadow-primary/20"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
