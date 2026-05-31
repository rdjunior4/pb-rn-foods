import { ProductCard, type Product } from "./ProductCard";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  linkLabel?: string;
  products: Product[];
}

export function ProductSection({
  title,
  subtitle,
  linkLabel = "Ver tudo",
  products,
}: ProductSectionProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 mt-10">
      <div className="flex items-end justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <a
          href="#"
          className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
        >
          {linkLabel}
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
          <ProductCard key={p.name} p={p} />
        ))}
      </div>
    </section>
  );
}
