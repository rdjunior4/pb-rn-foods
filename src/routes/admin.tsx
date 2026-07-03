import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, LogOut, Menu, X, ShoppingBag, Tags, ChevronLeft, ChevronRight, ChevronDown, Award, Users, BarChart3, Truck, Store, MapPin, PackagePlus, Ticket, Star, Boxes, FileText } from "lucide-react";
import { Logo } from "@/components/Logo";

const navGroups = [
  {
    label: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos", icon: Package },
      { label: "Categorias", href: "/admin/categorias", icon: Tags },
      { label: "Marcas", href: "/admin/marcas", icon: Award },
      { label: "Combos", href: "/admin/combos", icon: PackagePlus },
    ],
  },
  {
    label: "Operações",
    items: [
      { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
      { label: "Estoque", href: "/admin/estoque", icon: Boxes },
      { label: "Clientes", href: "/admin/clientes", icon: Users },
    ],
  },
  {
    label: "Logística",
    items: [
      { label: "Distribuidoras", href: "/admin/distribuidoras", icon: MapPin },
      { label: "Logística", href: "/admin/logistica", icon: Truck },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Cupons", href: "/admin/cupons", icon: Ticket },
      { label: "Avaliações", href: "/admin/avaliacoes", icon: Star },
    ],
  },
  {
    label: "Loja & Conteúdo",
    items: [
      { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
      { label: "Páginas", href: "/admin/paginas", icon: FileText },
      { label: "Minha Loja", href: "/admin/loja", icon: Store },
    ],
  },
];

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [{ title: "Admin — PB&RN Foods" }],
  }),
});

function AdminLayout() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Visão Geral"]));

  useEffect(() => {
    const stored = localStorage.getItem("@pbrn-admin-sidebar");
    if (stored === "collapsed") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (collapsed) return;
    const matched = navGroups.find((g) =>
      g.items.some((item) =>
        item.href === "/admin"
          ? location.pathname === "/admin"
          : location.pathname.startsWith(item.href)
      )
    );
    if (matched && !expandedGroups.has(matched.label)) {
      setExpandedGroups((prev) => new Set(prev).add(matched.label));
    }
  }, [location.pathname, collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("@pbrn-admin-sidebar", next ? "collapsed" : "expanded");
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      navigate({ to: "/entrar" });
    }
  }, [isLoggedIn, isAdmin, navigate]);

  if (!isLoggedIn || !isAdmin) return null;

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-zinc-900 flex flex-col transition-all duration-300 lg:translate-x-0 overflow-hidden ${
          mobileOpen ? "translate-x-0 w-56" : "-translate-x-full"
        } ${collapsed && !mobileOpen ? "w-16" : "w-56"}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-white/5 shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          {collapsed ? (
            <div className="w-8 h-8 overflow-hidden flex items-center justify-center">
              <Logo className="h-full w-full object-contain scale-75" />
            </div>
          ) : (
            <>
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden h-7 w-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group, gi) => {
            const isOverview = group.label === "Visão Geral";
            const isOpen = collapsed || isOverview || expandedGroups.has(group.label);
            return (
              <div key={group.label} className={gi > 0 ? "mt-3" : ""}>
                {collapsed ? (
                  gi > 0 && <div className="mx-2 my-2 border-t border-white/5" />
                ) : (
                  <button
                    type="button"
                    onClick={() => !isOverview && toggleGroup(group.label)}
                    className={`flex w-full items-center justify-between px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest ${
                      isOverview
                        ? "text-white/25 select-none cursor-default"
                        : "text-white/30 hover:text-white/60 select-none cursor-pointer transition-colors"
                    }`}
                  >
                    <span>{group.label}</span>
                    {!isOverview && (
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    )}
                  </button>
                )}
                {isOpen && (
                  <div className="space-y-0.5 px-2">
                    {group.items.map((item) => {
                      const isActive = item.href === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.href);
                      return (
                        <div key={item.href} className={`group relative ${collapsed ? "flex justify-center" : ""}`}>
                          <Link
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center rounded-lg transition-colors ${
                              collapsed
                                ? "h-9 w-9 justify-center mx-auto"
                                : "gap-2.5 px-3 py-2"
                            } ${
                              isActive
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:text-white hover:bg-white/5"
                            }`}
                            title={collapsed ? item.label : undefined}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                          </Link>
                          {collapsed && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-800 text-white text-xs shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                              {item.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center h-7 mx-2 mb-1 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* User section */}
        <div className={`border-t border-white/5 shrink-0 ${collapsed ? "p-2" : "p-3"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <button
                onClick={() => { logout(); navigate({ to: "/" }); }}
                className="h-7 w-7 flex items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="px-2 py-1 text-xs text-white/40 truncate">{user?.email}</div>
              <button
                onClick={() => { logout(); navigate({ to: "/" }); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-16" : "lg:pl-56"}`}>
        {/* Header */}
        <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 sm:px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors"
          >
            <Menu className="h-4 w-4 text-zinc-600" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Ver site
            </Link>
            <span className="text-xs text-zinc-300">|</span>
            <span className="text-sm text-zinc-500 font-medium truncate max-w-[160px]">
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
