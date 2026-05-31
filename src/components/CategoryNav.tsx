import {
  Menu,
  Tag,
  Wheat,
  Milk,
  Sandwich,
  Beef,
  Fish,
  Drumstick,
  Wine,
  Soup,
} from "lucide-react";

const categories = [
  { name: "Mercearia", icon: Wheat },
  { name: "Laticínios", icon: Milk },
  { name: "Frios e Queijos", icon: Sandwich },
  { name: "Carnes", icon: Beef },
  { name: "Aves e Pescados", icon: Fish },
  { name: "Embutidos", icon: Drumstick },
  { name: "Bebidas", icon: Wine },
  { name: "Molhos e Temperos", icon: Soup },
];

export function CategoryNav() {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1400px] items-stretch gap-3 px-4 sm:px-6">
        <button className="inline-flex items-center gap-2 bg-brand-black text-brand-black-foreground px-4 py-3 text-sm font-semibold rounded-t-md whitespace-nowrap hover:bg-brand-black/90 transition-colors">
          <Menu className="h-4 w-4" />
          Todas as categorias
        </button>

        <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <a
              key={c.name}
              href="#"
              className="group inline-flex items-center gap-2 px-3 py-2 my-1.5 rounded-md text-sm font-medium text-foreground hover:bg-muted hover:text-primary whitespace-nowrap transition-colors"
            >
              <c.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              {c.name}
            </a>
          ))}
        </nav>

        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 my-2 text-sm font-semibold rounded-md hover:bg-primary-hover transition-colors whitespace-nowrap shadow-sm">
          <Tag className="h-4 w-4" />
          Ofertas
        </button>
      </div>
    </div>
  );
}
