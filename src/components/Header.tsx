import { Search, User, ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="bg-background border-b border-border">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 lg:gap-8 px-4 sm:px-6 py-4">
        <a href="/" className="shrink-0">
          <Logo />
        </a>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="search"
              placeholder="Pesquisar produtos, marcas e categorias..."
              className="w-full h-12 rounded-lg border border-border bg-background pl-5 pr-14 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
            <button
              aria-label="Buscar"
              className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted transition"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 group">
            <User className="h-6 w-6 text-foreground" />
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Minha conta</div>
              <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Entrar ou cadastrar
              </div>
            </div>
          </a>

          <a href="#" className="flex items-center gap-2 group">
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-foreground" />
              <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                0
              </span>
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Meu carrinho</div>
              <div className="text-xs text-muted-foreground">R$ 0,00</div>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}
