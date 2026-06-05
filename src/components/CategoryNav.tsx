import { Tag, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/data";

export function CategoryNav() {
  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar py-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/categoria/${c.slug}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 whitespace-nowrap transition-all mr-1.5"
            >
              {c.name}
            </Link>
          ))}
          <Link
            to="/buscar"
            className="shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 whitespace-nowrap transition-all"
          >
            Ver todas
            <ChevronRight className="h-3 w-3" />
          </Link>
        </nav>

        <Link
          to="/buscar?q=oferta"
          className="shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-4 py-2 text-xs font-semibold rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all whitespace-nowrap"
        >
          <Tag className="h-3.5 w-3.5" />
          Ofertas
        </Link>
      </div>
    </div>
  );
}
