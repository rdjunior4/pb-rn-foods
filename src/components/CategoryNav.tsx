import {
  Wheat, ShoppingCart, Beef, Wine, Milk,
  Soup, Droplets, Shirt, Home,
  Package, Sandwich, Fish, Drumstick,
  ChevronRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCategories } from "@/lib/hooks";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wheat, ShoppingCart, Beef, Wine, Milk,
  Soup, Droplets, Shirt, Home,
  Package, Sandwich, Fish, Drumstick,
};

export function CategoryNav() {
  const { data: categories = [] } = useCategories();
  return (
    <nav className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 shrink-0">
        {categories.map((c) => {
          const Icon = iconMap[c.icon] || Wheat;
          return (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded border border-border/40 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 whitespace-nowrap transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              {c.name}
            </Link>
          );
        })}
      </div>
      <Link
        to="/buscar"
        search={{ q: "" }}
        className="shrink-0 inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 whitespace-nowrap transition-all"
      >
        Todas Categorias
        <ChevronRight className="h-3 w-3" />
      </Link>
    </nav>
  );
}
