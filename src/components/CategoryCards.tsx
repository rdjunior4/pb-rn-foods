import {
  Wheat, ShoppingCart, Beef, Wine, Milk,
  Soup, Droplets, Shirt, Home,
  Package, Sandwich, Fish, Drumstick, LayoutGrid,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCategories } from "@/lib/hooks";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wheat, ShoppingCart, Beef, Wine, Milk,
  Soup, Droplets, Shirt, Home,
  Package, Sandwich, Fish, Drumstick,
};

export function CategoryCards() {
  const { data: categories = [] } = useCategories();
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {categories.map((c) => {
          const Icon = iconMap[c.icon] || Wheat;
          return (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="group flex items-center gap-3 rounded border border-border/40 bg-card px-3 py-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
                <Icon className="h-5 w-5 text-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs font-semibold leading-tight">{c.name}</span>
            </Link>
          );
        })}
        <Link
          to="/buscar"
          search={{ q: "" }}
          className="group flex items-center gap-3 rounded border border-border/40 bg-card px-3 py-4 hover:border-primary hover:shadow-md transition-all"
        >
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-foreground group-hover:text-primary" />
          </div>
          <span className="text-xs font-semibold leading-tight">Ver todas</span>
        </Link>
      </div>
    </section>
  );
}
