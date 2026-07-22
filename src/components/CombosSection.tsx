import { Link } from "@tanstack/react-router";
import { Tag, ShoppingBag, ArrowRight, Percent, Plus, Check, Sparkles } from "lucide-react";
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
                  className="group relative bg-card rounded-xl border border-border/40 overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 w-[75vw] sm:w-auto shrink-0 sm:shrink flex flex-col"
                >
                  {/* Image grid */}
                  <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 p-4 pb-3">
                    {/* Badge */}
                    {combo.badge && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/20">
                          <Sparkles className="h-3 w-3" />
                          {combo.badge}
                        </span>
                      </div>
                    )}

                    {/* Discount circle */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <span className="text-[10px] font-bold text-white leading-none text-center">-{combo.discountPercent}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 w-full max-w-[160px] mx-auto">
                      {combo.items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-white rounded-lg border border-border/30 overflow-hidden flex items-center justify-center group-hover:border-primary/20 transition-colors shadow-sm"
                        >
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-contain p-1.5"
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
                          <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {item.quantity}x {item.productName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="border-t border-border/30 pt-3 mt-auto">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">De</p>
                          <p className="text-xs text-zinc-400 line-through">{formatCurrency(combo.originalTotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Por</p>
                          <p className="text-lg font-bold text-primary leading-none">{formatCurrency(combo.comboPrice)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          <Tag className="h-3 w-3" />
                          -{savings}
                        </span>
                        <button
                          onClick={() => handleAddCombo(combo)}
                          disabled={isAdded}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-lg transition-all active:scale-[0.97] ${
                            isAdded
                              ? "bg-emerald-500 text-white"
                              : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Adicionado
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Adicionar
                            </>
                          )}
                        </button>
                      </div>
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
