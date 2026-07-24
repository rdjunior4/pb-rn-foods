import { Search, User, ShoppingCart, Menu, LogIn, UserPlus, Package, Heart, Settings, LogOut, X, Home, Tag, Phone, ShieldCheck, Shield } from "lucide-react";
import { Logo } from "./Logo";
import type { Product } from "@/lib/types";
import { CartDrawer } from "./CartDrawer";
import { AuthModal } from "./AuthModal";
import { NotificationBell } from "./NotificationBell";
import { dispatchAuthModalEvent, onAuthModalToggle } from "@/lib/events";
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
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCategories, useProducts } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";

interface SearchInputProps {
  className?: string;
  onSearch: (q: string) => void;
  searchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
  onSuggestionClick: (slug: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchRef: React.RefObject<HTMLDivElement | null>;
  allProducts: Product[];
}

function SearchInput({ className = "", onSearch, searchFocused, setSearchFocused, onSuggestionClick, inputRef, searchRef, allProducts }: SearchInputProps) {
  const [localValue, setLocalValue] = useState("");
  const navigate = useNavigate();

  const suggestions = useMemo(() => {
    if (!localValue.trim() || localValue.trim().length < 2) return [];
    const q = localValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allProducts
      .filter((p) => {
        const name = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const brand = (p.brand || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(q) || brand.includes(q);
      })
      .slice(0, 6);
  }, [localValue, allProducts]);

  const showSuggestions = searchFocused && suggestions.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim()) {
      onSearch(localValue.trim());
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = useCallback((slug: string) => {
    setSearchFocused(false);
    onSuggestionClick(slug);
  }, [setSearchFocused, onSuggestionClick]);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Buscar produtos, marcas..."
          className="w-full h-10 rounded border border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-border/60 bg-card shadow-xl overflow-hidden z-50">
          <div className="p-2">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSuggestionClick(p.slug)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.brand}
                  </div>
                </div>
                <div className="text-sm font-bold text-foreground shrink-0">
                  {formatCurrency(p.price)}
                  <span className="text-[9px] text-muted-foreground ml-0.5">/{p.unit}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border/40 px-3 py-2">
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              <Search className="h-3 w-3" />
              Ver todos os resultados para "{localValue}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { totalItems } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts();
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    dispatchAuthModalEvent(authOpen);
  }, [authOpen]);

  useEffect(() => {
    return onAuthModalToggle((open, tab) => {
      if (open) {
        if (tab) setAuthTab(tab);
        setAuthOpen(true);
      } else {
        setAuthOpen(false);
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((q: string) => {
    navigate({ to: "/buscar", search: { q } });
  }, [navigate]);

  const handleSuggestionClick = useCallback((slug: string) => {
    setSearchFocused(false);
    navigate({ to: `/produto/${slug}` });
  }, [navigate]);

  return (
    <>
    <header
      className={`sticky top-0 z-50 text-white transition-all duration-300 ${
        scrolled
          ? "bg-brand-black/95 backdrop-blur-xl border-b border-white/5 shadow-elevated"
          : "bg-brand-black border-b border-white/5"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          <SearchInput
            className="hidden sm:block flex-1 mx-4 lg:mx-8"
            onSearch={handleSearch}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            onSuggestionClick={handleSuggestionClick}
            inputRef={inputRef}
            searchRef={searchRef}
            allProducts={allProducts}
          />

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 rounded border border-border/40 bg-primary hover:bg-primary-hover transition-colors group shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white shrink-0" />
                  {isLoggedIn ? (
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="text-sm font-semibold text-white">{user!.name}</div>
                      <div className="text-[11px] text-white/70">Minha conta</div>
                    </div>
                  ) : (
                    <div className="text-left leading-tight hidden sm:block">
                      <div className="text-sm font-bold text-white whitespace-nowrap">Cadastre-se</div>
                      <div className="text-[11px] text-white/70 whitespace-nowrap">Ou faça login</div>
                    </div>
                  )}
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
                    <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => { setAuthTab("login"); setAuthOpen(true); }}>
                      <LogIn className="h-4 w-4" />
                      <span>Entrar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-3" onClick={() => { setAuthTab("register"); setAuthOpen(true); }}>
                      <UserPlus className="h-4 w-4" />
                      <span>Criar conta</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-10 rounded border border-border/40 hover:bg-white/5 transition-colors group relative shrink-0"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white/70 group-hover:text-white transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/30">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-sm font-semibold text-white">Carrinho</div>
                <div className="text-[11px] text-white/40">
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                </div>
              </div>
            </button>

            {isLoggedIn && <NotificationBell />}
          </div>
        </div>

        <SearchInput
          className="sm:hidden mt-3"
          onSearch={handleSearch}
          searchFocused={searchFocused}
          setSearchFocused={setSearchFocused}
          onSuggestionClick={handleSuggestionClick}
          inputRef={inputRef}
          searchRef={searchRef}
          allProducts={allProducts}
        />
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
                {categories.map((c) => (
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
                  {isLoggedIn ? (
                    <Link to="/minha-conta" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <User className="h-4 w-4" />
                      Minha conta
                    </Link>
                  ) : (
                    <button onClick={() => { setAuthTab("login"); setAuthOpen(true); }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full text-left">
                      <User className="h-4 w-4" />
                      Cadastre-se ou faça Login
                    </button>
                  )}
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
                  <Link to="/pagina/$slug" params={{ slug: "troca-e-devolucao" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
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
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </header>
    </>
  );
}
