import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useNavigate } from "@tanstack/react-router";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, getItemQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const navigate = useNavigate();

  const qty = getItemQuantity(product.id);
  const favorite = isFavorite(product.id);
  const hasDiscount = product.discount && product.discount > 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-3 sm:p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="inline-flex items-center rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
            -{product.discount}%
          </span>
        )}
      </div>

      <button
        onClick={() => toggleFavorite(product.id)}
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute top-2.5 right-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-all shadow-sm md:opacity-0 md:group-hover:opacity-100"
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
      </button>

      <div
        onClick={() => navigate({ to: `/produto/${product.slug}` })}
        className="relative flex h-36 sm:h-40 items-center justify-center bg-gradient-to-b from-muted/30 to-muted/50 rounded-xl mb-3 overflow-hidden cursor-pointer group/img"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 md:group-hover/img:bg-black/10 transition-colors">
          <span className="rounded-full bg-white/90 p-2 md:opacity-0 md:group-hover/img:opacity-100 transition-all duration-300 shadow-lg md:translate-y-2 md:group-hover/img:translate-y-0">
            <Eye className="h-4 w-4 text-foreground" />
          </span>
        </div>
      </div>

      <h3
        onClick={() => navigate({ to: `/produto/${product.slug}` })}
        className="text-sm font-semibold leading-snug line-clamp-2 cursor-pointer group/title"
      >
        <span className="group-hover/title:text-primary transition-colors">{product.name}</span>
      </h3>

      <div className="mt-1.5 text-[11px] text-muted-foreground">{product.brand}</div>

      <div className="mt-auto flex items-end justify-between pt-3 border-t border-border/50">
        <div>
          {product.oldPrice && (
            <div className="text-[11px] text-muted-foreground line-through">
              R$ {product.oldPrice.toFixed(2)}
            </div>
          )}
          <div className="text-base font-extrabold text-foreground tracking-tight">
            R$ {product.price.toFixed(2)}
            <span className="text-[10px] font-medium text-muted-foreground ml-0.5">
              /{product.unit}
            </span>
          </div>
        </div>
        <button
          onClick={() => addItem(product.id)}
          aria-label="Adicionar ao carrinho"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-90"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
        </button>
      </div>

      {qty > 0 && (
        <div className="absolute bottom-[72px] right-3 text-[10px] font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded-md">
          {qty} no carrinho
        </div>
      )}
    </div>
  );
}
