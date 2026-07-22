import { Link } from "@tanstack/react-router";
import { ShoppingBag, ArrowRight, Percent, Plus, Check } from "lucide-react";
import { useCombos } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { useState } from "react";

export function CombosSection() {
  const { data: combos = [] } = useCombos();
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const activeCombos = combos.filter((c) => c.active);
  if (activeCombos.length === 0) return null;

  const handleAddCombo = (combo: typeof activeCombos[0]) => {
    for (const item of combo.items) {
      addItem(item.productId, item.quantity, undefined, item.unitPrice);
    }
    setAddedId(combo.id);
    setTimeout(() => setAddedId(null), 1500);
    toast.success(`Combo "${combo.name}" adicionado ao carrinho!`, {
      description: `${combo.items.length} itens — ${formatCurrency(combo.comboPrice)}`,
    });
  };

  return (
    <section className="mt-10 px-3 sm:px-5 lg:px-[24px]">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">Combos promocionais</h2>
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Percent className="h-3 w-3" />
                  ECONOMIZE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Adicione combos ao carrinho e aproveite descontos especiais</p>
            </div>
          </div>
          <Link
            to="/buscar"
            search={{ q: "combo" }}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap transition-colors shrink-0"
          >
            <span>Ver todos</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Combos */}
        <div className="overflow-x-auto no-scrollbar sm:overflow-visible">
          <div className="flex gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 w-max sm:w-auto">
            {activeCombos.slice(0, 4).map((combo) => {
              const isAdded = addedId === combo.id;
              const savings = combo.discountType === "fixed"
                ? formatCurrency(combo.discountValue)
                : `${combo.discountPercent}%`;
              return (
                <div
                  key={combo.id}
                  className="group relative bg-card rounded-xl border-2 border-amber-200/60 overflow-hidden hover:shadow-xl hover:shadow-amber-400/10 hover:border-amber-400 transition-all duration-300 w-[75vw] sm:w-auto shrink-0 sm:shrink flex flex-col"
                >
                  {/* Image grid */}
                  <div className="relative bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-5 pb-4">
                    {/* Discount badge — top left */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/20">
                        -{savings}
                      </span>
                    </div>

                    {/* Items count — top right */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-amber-700 text-[10px] font-semibold px-2 py-1 rounded-full border border-amber-200 shadow-sm">
                        <ShoppingBag className="h-3 w-3" />
                        {combo.items.length} itens
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] mx-auto mt-1">
                      {combo.items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-white rounded-xl border border-amber-100 overflow-hidden flex items-center justify-center group-hover:border-amber-300 group-hover:shadow-md transition-all shadow-sm"
                        >
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {combo.name}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {combo.description}
                      </p>
                    )}

                    {/* Items */}
                    <div className="space-y-1 mb-4 flex-1">
                      {combo.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-1 w-1 rounded-full bg-amber-400/60 shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {item.quantity}x {item.productName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing + CTA */}
                    <div className="border-t border-amber-100 pt-3 mt-auto space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">De</p>
                          <p className="text-xs text-zinc-400 line-through">{formatCurrency(combo.originalTotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Por</p>
                          <p className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent leading-none">{formatCurrency(combo.comboPrice)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddCombo(combo)}
                        disabled={isAdded}
                        className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg transition-all active:scale-[0.97] ${
                          isAdded
                            ? "bg-emerald-500 text-white"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm shadow-amber-400/20"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            Adicionado ao carrinho
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Adicionar combo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
