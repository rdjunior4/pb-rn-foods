import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import {
  Package, Heart, MapPin, Settings, LogOut, User, ShoppingCart,
  FileText, ChevronRight, TrendingUp, DollarSign, CreditCard,
  HelpCircle, Bell, Pencil, Camera,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useOrdersByCustomer } from "@/lib/hooks";
import { CustomerLayout } from "@/components/CustomerLayout";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta | PB&RN Foods" },
      { name: "description", content: "Gerencie seus dados, pedidos e preferencias na PB&RN Foods." },
    ],
  }),
  component: AccountPage,
});

type SectionItem = {
  icon: typeof Package;
  label: string;
  desc: string;
  badge?: string;
  route?: string;
};

const sections: { title: string; items: SectionItem[] }[] = [
  {
    title: "Pedidos",
    items: [
      { icon: Package, label: "Meus pedidos", desc: "Acompanhe suas compras", route: "/minha-conta/pedidos" },
      { icon: ShoppingCart, label: "Carrinhos salvos", desc: "Retome compras pendentes", route: "/carrinho" },
    ],
  },
  {
    title: "Favoritos",
    items: [
      { icon: Heart, label: "Lista de desejos", desc: "Produtos favoritados", route: "/favoritos" },
    ],
  },
  {
    title: "Dados da conta",
    items: [
      { icon: User, label: "Dados pessoais", desc: "Nome, e-mail e telefone" },
      { icon: MapPin, label: "Endereços", desc: "Gerencie endereços de entrega", route: "/minha-conta/enderecos" },
      { icon: CreditCard, label: "Pagamentos", desc: "Formas de pagamento salvas", route: "/minha-conta/pagamentos" },
    ],
  },
  {
    title: "Suporte",
    items: [
      { icon: HelpCircle, label: "Central de ajuda", desc: "Tire suas dúvidas", route: "/pagina/faq" },
      { icon: Bell, label: "Notificações", desc: "Alertas de pedidos e ofertas", route: "/minha-conta/notificacoes" },
      { icon: Settings, label: "Configurações", desc: "Preferências da conta", route: "/minha-conta/configuracoes" },
    ],
  },
];

function AccountPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const { data: allOrders = [] } = useOrdersByCustomer(isLoggedIn ? user!.id : "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try { return localStorage.getItem("pbrn-user-avatar"); } catch { return null; }
  });

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem muito grande. Máximo 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      try { localStorage.setItem("pbrn-user-avatar", dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  }, []);

  const myOrders = isLoggedIn ? allOrders : [];
  const activeOrders = myOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  const handleSoon = (label: string) => {
    toast.info(`"${label}" estará disponível em breve`);
  };

  if (!isLoggedIn) {
    return (
    <CustomerLayout maxWidth="1400" noPadding fullWidth>
        <div className="text-center py-24">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 mb-8 ring-1 ring-primary/10">
            <User className="h-12 w-12 text-primary/40" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Faça login para continuar</h1>
          <p className="text-muted-foreground mt-2 mb-8 max-w-sm mx-auto">Acesse sua conta para ver pedidos, favoritos e muito mais.</p>
          <Link
            to="/entrar"
            search={{ tab: "login", redirect: "/minha-conta" }}
            className="inline-flex items-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-semibold px-8 text-sm hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Entrar agora
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const initials = user!.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isBasePath = location.pathname === "/minha-conta";

  if (!isBasePath) {
    return (
      <CustomerLayout maxWidth="1400" noPadding fullWidth>
        <Outlet />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout maxWidth="1400" noPadding fullWidth>
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-b from-red-600 to-red-700 -mt-8 pt-10 sm:pt-12 pb-8 sm:pb-10 mb-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[30px]">
          {/* Top: Title + Buttons */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover ring-2 ring-white/25 shadow-lg" />
                ) : (
                  <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-2 ring-white/25 text-white text-xl font-black shadow-lg">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-red-600 shadow-sm" />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Name + Meta */}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{user!.name}</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5">
                  <span className="inline-flex items-center rounded-lg bg-white/15 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0">
                    {user!.documentType === "cnpj" ? "CNPJ" : "CPF"}
                  </span>
                  <span className="w-px h-3 bg-white/20 shrink-0" />
                  <span className="text-white/60 text-[11px] font-medium truncate">
                    {new Date(user!.createdAt).getFullYear()}
                  </span>
                  <span className="w-px h-3 bg-white/20 shrink-0 hidden sm:block" />
                  <span className="text-white/60 text-[11px] font-medium truncate hidden sm:block">{user!.email}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-4 hover:bg-white/20 transition-all ring-1 ring-white/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 text-xs font-semibold px-4 hover:bg-white/20 hover:text-white transition-all ring-1 ring-white/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-4" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-4 gap-3">
            {[
              { icon: Package, label: "Pedidos", value: String(myOrders.length) },
              { icon: TrendingUp, label: "Ativos", value: String(activeOrders.length) },
              { icon: DollarSign, label: "Gasto total", value: formatCurrency(myOrders.reduce((s, o) => s + o.total, 0)) },
              { icon: Heart, label: "Favoritos", value: String(wishlistItems.length) },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2.5 min-w-0">
                {i > 0 && i % 2 !== 0 && <span className="hidden sm:block w-px h-8 bg-white/10 mr-1" />}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 shrink-0">
                    <stat.icon className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-white/40 font-medium uppercase tracking-wide leading-none">{stat.label}</div>
                    <div className="text-sm font-bold text-white leading-tight mt-0.5 truncate">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-[30px] pt-8 pb-8 max-w-[1400px] mx-auto">
      {myOrders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pedidos recentes</h3>
            <button onClick={() => navigate({ to: "/minha-conta/pedidos" })} className="text-xs text-primary font-medium hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {myOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="group rounded-xl border border-border/40 bg-card p-4 sm:p-5 hover:shadow-card-hover hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate({ to: `/pedido/${order.id}` })}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{order.id}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-semibold ${
                      order.status === "pending" ? "bg-amber-50 text-amber-700" :
                      order.status === "confirmed" ? "bg-blue-50 text-blue-700" :
                      order.status === "shipped" ? "bg-purple-50 text-purple-700" :
                      order.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        order.status === "pending" ? "bg-amber-500" :
                        order.status === "confirmed" ? "bg-blue-500" :
                        order.status === "shipped" ? "bg-purple-500" :
                        order.status === "delivered" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {order.status === "pending" ? "Pendente" :
                       order.status === "confirmed" ? "Confirmado" :
                       order.status === "shipped" ? "Enviado" :
                       order.status === "delivered" ? "Entregue" : "Cancelado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? "item" : "itens"} — {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border/20 mb-6" />

      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div key={section.title}>
            {sIdx > 0 && <div className="border-t border-border/20 mb-6" />}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.route) {
                      navigate({ to: item.route as any });
                    } else if (item.label === "Dados pessoais") {
                      setEditOpen(true);
                    } else {
                      handleSoon(item.label);
                    }
                  }}
                  className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-border/40 bg-card p-4 sm:p-5 hover:border-primary/30 hover:shadow-card-hover transition-all text-left w-full"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary px-1.5">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />
      </div>
    </CustomerLayout>
  );
}
