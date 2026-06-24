import { Link } from "@tanstack/react-router";
import { Tag, ShoppingBag, ArrowRight, Percent } from "lucide-react";
import { getCombos } from "@/lib/admin-store";
import { formatCurrency } from "@/lib/format";

export function CombosSection() {
  const combos = getCombos().filter((c) => c.active);

  if (combos.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Combos promocionais</h2>
          </div>
          <span className="hidden sm:inline text-sm text-muted-foreground">
            Adicione combos ao carrinho e aproveite descontos especiais!
          </span>
        </div>
        <Link
          to="/buscar"
          search={{ q: "combo" }}
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {combos.slice(0, 4).map((combo) => (
          <div
            key={combo.id}
            className="group relative bg-white rounded-xl border border-border/40 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            {combo.badge && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <Percent className="h-3 w-3" />
                  {combo.badge}
                </span>
              </div>
            )}

            <div className="flex items-stretch">
              {/* Product images grid */}
              <div className="w-2/5 bg-muted/30 p-3 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1.5 w-full">
                  {combo.items.slice(0, 4).map((item, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white rounded-lg border border-border/30 overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Combo info */}
              <div className="w-3/5 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                    {combo.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {combo.description}
                  </p>

                  {/* Items list */}
                  <div className="space-y-1 mb-3">
                    {combo.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[70%]">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="text-zinc-400">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between border-t border-border/30 pt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">De</p>
                    <p className="text-xs text-zinc-400 line-through">{formatCurrency(combo.originalTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(combo.comboPrice)}</p>
                  </div>
                </div>

                  {/* Savings badge */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <Tag className="h-3 w-3" />
                      {combo.discountType === "fixed"
                        ? `Economize ${formatCurrency(combo.discountValue)}`
                        : `Economize ${combo.discountPercent}%`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{combo.items.length} itens</span>
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
