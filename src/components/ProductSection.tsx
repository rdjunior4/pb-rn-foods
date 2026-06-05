import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
  products: Product[];
  variant?: "default" | "alt";
}

export function ProductSection({
  title,
  subtitle,
  linkLabel = "Ver tudo",
  linkTo = "/",
  products,
  variant = "default",
}: ProductSectionProps) {
  return (
    <section className={`mx-auto max-w-[1400px] px-4 sm:px-6 ${variant === "alt" ? "mt-14" : "mt-10"}`}>
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            {variant === "alt" && (
              <span className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary-hover shrink-0" />
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {linkLabel && (
          <Link
            to={linkTo}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap transition-colors"
          >
            <span>{linkLabel}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
