import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ShoppingCart, Heart, Truck, ShieldCheck,
  Minus, Plus, Package, RotateCcw, Check, Share2, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProductBySlug, useProductsByCategory, useCategories } from "@/lib/hooks";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { ProductCard } from "@/components/ProductCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/produto/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();
  const { addItem, getItemQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tab, setTab] = useState<"desc" | "specs">("desc");
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  const hasVariants = (product?.variants?.length ?? 0) > 0;

  const selectedVariant = useMemo(() => {
    if (!product || !hasVariants) return undefined;
    return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  }, [product, selectedVariantId, hasVariants]);

  const { data: relatedProducts = [] } = useProductsByCategory(product?.categoryId || "");

  if (isLoading) {
    return (
      <CustomerLayout maxWidth="1200">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando produto...</span>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout maxWidth="1200">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">Voltar ao início</Link>
        </div>
      </CustomerLayout>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const favorite = isFavorite(product.id);

  const currentPrice = selectedVariant ? selectedVariant.unitPrice : product.price;
  const currentOldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentUnit = selectedVariant ? selectedVariant.unit : product.unit;
  const cartQty = getItemQuantity(product.id, selectedVariant?.id);

  const images = product.images.length > 0
    ? product.images
    : [product.image, `https://picsum.photos/seed/${product.slug}-2/400/400`, `https://picsum.photos/seed/${product.slug}-3/400/400`];

  const handleAdd = () => {
    addItem(product.id, qty, selectedVariant?.id, currentPrice);
    const variantLabel = selectedVariant ? ` (${selectedVariant.label})` : "";
    toast.success(`${product.name}${variantLabel} adicionado ao carrinho`, {
      description: `${qty}x — ${formatCurrency(currentPrice * qty)}`,
      action: { label: "Ver carrinho", onClick: () => navigate({ to: "/carrinho" }) },
    });
    setQty(1);
  };

  const related = relatedProducts.filter((p) => p.id !== product.id).slice(0, 5);

  const stockLevel = currentStock > 20 ? "high" : currentStock > 5 ? "low" : "critical";
  const stockLabel = stockLevel === "high" ? "Em estoque" : stockLevel === "low" ? `Apenas ${currentStock} unidades` : "Últimas unidades";
  const stockColor = stockLevel === "high" ? "text-emerald-600" : "text-amber-600";

  const getTierPrice = (quantity: number) => {
    if (!product.pricingTiers.length) return null;
    const sorted = [...product.pricingTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    return sorted.find((t) => quantity >= t.minQuantity);
  };

  const currentTier = getTierPrice(qty);

  const content = (
    <>
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        {category && (
          <>
            <span>/</span>
            <Link to="/categoria/$slug" params={{ slug: category.slug }} className="hover:text-primary transition-colors">{category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {product.discount && product.discount > 0 && (
              <span className="absolute top-4 left-4 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-lg">
                -{product.discount}%
              </span>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((p) => (p > 0 ? p - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedImage((p) => (p < images.length - 1 ? p + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImage ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-0.5">{product.brand}</div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>
            </div>
            <button
              onClick={() => {
                toggleFavorite(product.id);
                toast.success(favorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
              }}
              className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <Heart className={`h-5 w-5 ${favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          </div>

          {hasVariants && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-foreground mb-2">Comprar por</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = (selectedVariant?.id ?? product.variants[0].id) === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`flex-1 min-w-[140px] rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{v.label}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-foreground">{formatCurrency(v.unitPrice)}</span>
                        <span className="text-xs text-muted-foreground">/{v.unit}</span>
                      </div>
                      {v.boxPrice && v.boxQuantity && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(v.boxPrice)}/{v.boxQuantity}{v.unit}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            {currentOldPrice && (
              <span className="text-base sm:text-lg text-muted-foreground line-through">
                {formatCurrency(currentOldPrice)}
              </span>
            )}
            <span className="text-3xl sm:text-4xl font-extrabold">
              {formatCurrency(currentPrice)}
            </span>
            <span className="text-sm text-muted-foreground">/{currentUnit}</span>
            {product.discount && product.discount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-0.5">
                Economize {formatCurrency((currentOldPrice ?? currentPrice) - currentPrice)}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${stockColor}`}>
              <span className={`h-2 w-2 rounded-full ${stockLevel === "high" ? "bg-emerald-500" : "bg-amber-500"}`} />
              {stockLabel}
            </span>
            <span className="text-muted-foreground text-xs">
              ({currentStock} disponíveis)
            </span>
          </div>

          <div className="mt-5 border-t border-border/40 pt-5">
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
              <button
                onClick={() => setTab("desc")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  tab === "desc" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Descrição
              </button>
              <button
                onClick={() => setTab("specs")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  tab === "specs" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Especificações
              </button>
            </div>

            {tab === "desc" && (
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>{product.description}</p>
                <ul className="space-y-1.5">
                  {product.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "specs" && (
              <div className="mt-4">
                <table className="w-full text-sm">
                  <tbody>
                    {product.specs.map((s, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="py-2.5 px-3 font-medium text-foreground w-1/3">{s.label}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {product.pricingTiers.length > 0 && (
            <div className="mt-6 rounded-lg border border-border/40 bg-muted/30 p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Leve mais, pague menos</h3>
              <div className="space-y-2">
                {product.pricingTiers.map((tier) => {
                  const isActive = currentTier?.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center justify-between rounded-lg p-2.5 transition-colors ${
                        isActive ? "bg-primary/10 border border-primary/20" : "bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">A partir de</span>
                        <span className="text-sm font-semibold text-foreground">{tier.minQuantity} {currentUnit}{tier.minQuantity > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.discountPercent > 0 && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5">
                            -{tier.discountPercent}%
                          </span>
                        )}
                        <span className="text-sm font-bold text-foreground">{formatCurrency(tier.pricePerUnit)}/{currentUnit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-border/40 hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-11 w-16 text-center text-sm font-semibold rounded border border-border/40 bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-border/40 hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: <strong className="text-foreground">{formatCurrency(currentPrice * qty)}</strong>
              {currentTier && currentTier.discountPercent > 0 && (
                <span className="ml-2 text-emerald-600 font-semibold">(-{currentTier.discountPercent}%)</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              <ShoppingCart className="h-5 w-5" />
              Adicionar ao carrinho
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copiado!");
              }}
              className="inline-flex h-[52px] w-[52px] items-center justify-center rounded border border-border/40 hover:bg-muted transition-colors"
            >
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {cartQty > 0 && (
            <Link
              to="/carrinho"
              className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              {cartQty} {cartQty === 1 ? "item no carrinho" : "itens no carrinho"} — Ir para o carrinho →
            </Link>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border/40 pt-6">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium">Entrega rápida</div>
                <div className="text-xs text-muted-foreground">Para todo o Brasil</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium">Compra segura</div>
                <div className="text-xs text-muted-foreground">Produto original</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Package className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium">Embalagem reforçada</div>
                <div className="text-xs text-muted-foreground">Transporte protegido</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <RotateCcw className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium">Devolução fácil</div>
                <div className="text-xs text-muted-foreground">7 dias de garantia</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Produtos relacionados</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Da mesma categoria</p>
            </div>
            {category && (
              <Link
                to="/categoria/$slug"
                params={{ slug: category.slug }}
                className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Ver categoria →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <ReviewsSection productId={product.id} />

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background p-3 md:hidden">
        <button
          onClick={handleAdd}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary-hover transition-colors shadow-lg"
        >
          <ShoppingCart className="h-5 w-5" />
          Adicionar — {formatCurrency(currentPrice * qty)}
        </button>
      </div>
    </>
  );

  return (
    <CustomerLayout maxWidth="1200">
      {content}
    </CustomerLayout>
  );
}
