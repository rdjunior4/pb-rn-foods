import { Search, User, ShoppingCart, Menu, LogIn, UserPlus, Package, Heart, Settings, LogOut, X, Home, Tag, Phone, ShieldCheck, Shield } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCategories } from "@/lib/data";

export function Header() {
  const { totalItems } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          ? "bg-brand-black/95 backdrop-blur-xl border-b border-white/5 shadow-elevated"
          : "bg-brand-black border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 sm:gap-6 px-4 sm:px-6 lg:px-[30px] py-3">
        <button
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
          className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <form onSubmit={handleSearch} className="hidden sm:block flex-1 mx-4 lg:mx-8">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos, marcas..."
              className="w-full h-10 rounded border border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all"
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
            onClick={() => navigate({ to: "/buscar", search: { q: "" } })}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
          >
            <Search className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 rounded border border-border/40 bg-primary hover:bg-primary-hover transition-colors group">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-sm font-semibold text-white">Minha conta</div>
                  <div className="text-[11px] text-white/70">
                    {isLoggedIn ? user!.name : "Entrar"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 rounded border-border/40 shadow-xl">
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
                  <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/favoritos" })}>
                    <Heart className="h-4 w-4" />
                    <span>Lista de desejos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/minha-conta" })}>
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => navigate({ to: "/admin" })}>
                        <Shield className="h-4 w-4" />
                        <span>Painel Admin</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-3 text-muted-foreground" onClick={() => { logout(); navigate({ to: "/" }); }}>
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
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 rounded border border-border/40 hover:bg-white/5 transition-colors group relative"
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

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 sm:w-80 bg-brand-black border-white/5 p-0 flex flex-col">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <Logo />
            <SheetClose className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </SheetClose>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div>
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">Navegar</h3>
              <div className="space-y-0.5">
                <SheetClose asChild>
                  <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Home className="h-4 w-4" />
                    Início
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/buscar" search={{ q: "oferta" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Tag className="h-4 w-4" />
                    Ofertas
                  </Link>
                </SheetClose>
              </div>
            </div>

            <div>
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">Categorias</h3>
              <div className="space-y-0.5">
                {getCategories().map((c) => (
                  <SheetClose key={c.id} asChild>
                    <Link
                      to="/categoria/$slug"
                      params={{ slug: c.slug }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                      {c.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>

            <div>
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">Acesso</h3>
              <div className="space-y-0.5">
                <SheetClose asChild>
                  <Link to={isLoggedIn ? "/minha-conta" : "/entrar"} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <User className="h-4 w-4" />
                    {isLoggedIn ? "Minha conta" : "Entrar"}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/carrinho" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <ShoppingCart className="h-4 w-4" />
                    Carrinho
                  </Link>
                </SheetClose>
              </div>
            </div>

            <div>
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">Ajuda</h3>
              <div className="space-y-0.5">
                <SheetClose asChild>
                  <a href="https://wa.me/5583999999999" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Phone className="h-4 w-4" />
                    Fale conosco
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/buscar" search={{ q: "oferta" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <ShieldCheck className="h-4 w-4" />
                    Troca e devolução
                  </Link>
                </SheetClose>
              </div>
            </div>
          </nav>

          <div className="px-5 py-4 border-t border-white/5">
            <p className="text-[11px] text-white/20 text-center">PB&RN Foods © 2026</p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
