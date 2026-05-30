import { Menu, Tag } from "lucide-react";

const categories = [
  "Mercearia",
  "Laticínios",
  "Frios e Queijos",
  "Carnes",
  "Aves e Pescados",
  "Embutidos",
  "Bebidas",
  "Molhos e Temperos",
];

export function CategoryNav() {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1400px] items-stretch gap-2 px-4 sm:px-6">
        <button className="inline-flex items-center gap-2 bg-brand-black text-brand-black-foreground px-4 py-3 text-sm font-semibold rounded-t-md whitespace-nowrap">
          <Menu className="h-4 w-4" />
          Todas as categorias
        </button>

        <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <a
              key={c}
              href="#"
              className="px-3 py-3 text-sm font-medium text-foreground hover:text-primary whitespace-nowrap transition-colors"
            >
              {c}
            </a>
          ))}
        </nav>

        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 my-2 text-sm font-semibold rounded-md hover:bg-primary-hover transition-colors whitespace-nowrap">
          <Tag className="h-4 w-4" />
          Ofertas
        </button>
      </div>
    </div>
  );
}
