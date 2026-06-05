import { Search, User, ShoppingCart, Menu, LogIn, UserPlus, Package, Heart, Settings, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { CartDrawer } from "./CartDrawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export function Header() {
  const { totalItems } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: "/buscar", search: { q: search.trim() } });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 text-white transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10"
          : "bg-[#0a0a0a] border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 sm:gap-6 px-4 sm:px-6 py-3">
        <button
          aria-label="Menu"
          className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <a href="/" className="shrink-0">
          <Logo />
        </a>

        <form onSubmit={handleSearch} className="hidden sm:block flex-1 mx-4 lg:mx-8">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos, marcas..."
              className="w-full h-10 rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            aria-label="Buscar"
            onClick={() => navigate({ to: "/buscar" })}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover transition-colors group">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-sm font-semibold text-white">Minha conta</div>
                  <div className="text-[11px] text-white/70">
                    {isLoggedIn ? user!.name : "Entrar"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 rounded-xl border-border/50 shadow-xl">
              {isLoggedIn ? (
                <>
                  <DropdownMenuLabel>
                    <span className="font-normal text-xs text-muted-foreground">Conta</span>
                    <p className="font-semibold text-sm mt-0.5">{user!.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user!.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/minha-conta" })}>
                    <Package className="h-4 w-4" />
                    <span>Meus pedidos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-3">
                    <Heart className="h-4 w-4" />
                    <span>Lista de desejos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-3">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-3 text-muted-foreground" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>
                    <span className="font-normal text-xs text-muted-foreground">Acesso</span>
                    <p className="font-semibold text-sm mt-0.5">Olá, visitante</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/entrar" })}>
                    <LogIn className="h-4 w-4" />
                    <span>Entrar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/entrar" })}>
                    <UserPlus className="h-4 w-4" />
                    <span>Criar conta</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group relative"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white/70 group-hover:text-white transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/30">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-sm font-semibold text-white">Carrinho</div>
              <div className="text-[11px] text-white/40">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </div>
            </div>
          </button>
        </div>
      </div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
