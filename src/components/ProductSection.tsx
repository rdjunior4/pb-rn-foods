import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
  linkSearch?: Record<string, string>;
  products: Product[];
  variant?: "default" | "alt" | "featured";
}

export function ProductSection({
  title,
  subtitle,
  linkLabel = "Ver tudo",
  linkTo = "/",
  linkSearch,
  products,
  variant = "default",
}: ProductSectionProps) {
  const isFeatured = variant === "featured";

  return (
    <section className={`mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] ${variant === "alt" ? "mt-14" : "mt-10"}`}>
      <div className={isFeatured ? "rounded-lg border-2 border-primary/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent p-4 sm:p-6 shadow-sm" : ""}>
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            {isFeatured && (
              <span className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary-hover shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{title}</h2>
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    OFERTAS
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {linkLabel && (
            <Link
              to={linkTo}
              search={linkSearch}
              className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap transition-colors shrink-0"
            >
              <span>{linkLabel}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* ─── Grid ─── */}
        <div className="overflow-x-auto no-scrollbar sm:overflow-visible -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-2.5 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3 lg:gap-4 w-max sm:w-auto">
            {products.map((p) => (
              <div key={p.id} className="w-[160px] sm:w-auto shrink-0 sm:shrink">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
