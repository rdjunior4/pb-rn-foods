import { Search, ShoppingCart, Menu, LogIn, UserPlus, Heart, LogOut, X, Home, Tag, Phone, ShieldCheck, Shield, User } from "lucide-react";
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-brand-black/95 backdrop-blur-xl border-b border-white/5 shadow-elevated"
          : "bg-brand-black border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-[30px] py-3 gap-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-brand-black font-semibold text-sm transition-colors">
                <User className="h-5 w-5" />
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold">Cadastre-se</div>
                  <div className="text-[10px] font-normal opacity-80">Ou faça Login</div>
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
                    <Heart className="h-4 w-4" />
                    <span>Meus pedidos</span>
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
            className="flex items-center gap-2 px-3 h-10 rounded-lg border border-white/20 hover:bg-white/10 transition-colors group relative text-white"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 text-brand-black px-1 text-[10px font-bold shadow-sm">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-xs font-semibold text-white">Carrinho</div>
              <div className="text-[10px] text-white/40">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] pb-3">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar produtos..."
              className="w-full h-12 rounded-lg border-0 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </form>
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
