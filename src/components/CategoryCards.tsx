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
    <section className="mt-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mb-3">
        <h2 className="text-lg font-extrabold tracking-tight">Categorias</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar sm:overflow-visible">
        <div className="flex gap-3 px-4 sm:px-6 lg:px-[30px] sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 sm:max-w-[1400px] sm:mx-auto">
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || Wheat;
            return (
              <Link
                key={c.id}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card px-3 py-3 sm:py-4 hover:border-primary hover:shadow-md transition-all shrink-0 sm:shrink"
              >
                <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground group-hover:text-primary" />
                </div>
                <span className="text-xs font-semibold leading-tight whitespace-nowrap">{c.name}</span>
              </Link>
            );
          })}
          <Link
            to="/buscar"
            search={{ q: "" }}
            className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card px-3 py-3 sm:py-4 hover:border-primary hover:shadow-md transition-all shrink-0 sm:shrink"
          >
            <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-foreground group-hover:text-primary" />
            </div>
            <span className="text-xs font-semibold leading-tight whitespace-nowrap">Ver todas</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
