import {
  Wheat,
  Milk,
  Sandwich,
  Beef,
  Fish,
  Drumstick,
  Wine,
  Soup,
  LayoutGrid,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/data";

export function CategoryCards() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 mt-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/categoria/${c.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-4 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
              <Wheat className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <span className="text-xs font-semibold leading-tight">{c.name}</span>
          </Link>
        ))}
        <Link
          to="/buscar"
          className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-4 hover:border-primary hover:shadow-md transition-all"
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
