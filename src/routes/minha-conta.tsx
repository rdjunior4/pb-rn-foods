import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Package, Heart, MapPin, Settings, LogOut, User, ShoppingCart,
  Clock, FileText, Phone, Mail, CreditCard, Building2, UserCircle,
  ChevronRight, Award, TrendingUp, DollarSign,
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
      { icon: Package, label: "Meus pedidos", desc: "Acompanhe suas compras" },
      { icon: ShoppingCart, label: "Carrinhos salvos", desc: "Retome compras pendentes", route: "/carrinho" },
    ],
  },
  {
    title: "Favoritos",
    items: [
      { icon: Heart, label: "Lista de desejos", desc: "Produtos favoritados", route: "/favoritos" },
      { icon: TrendingUp, label: "Produtos vistos", desc: "Últimas visualizações" },
    ],
  },
  {
    title: "Dados da conta",
    items: [
      { icon: User, label: "Dados pessoais", desc: "Nome, e-mail e telefone" },
      { icon: MapPin, label: "Endereços", desc: "Gerencie endereços de entrega" },
      { icon: CreditCard, label: "Pagamentos", desc: "Formas de pagamento salvas" },
    ],
  },
  {
    title: "Suporte",
    items: [
      { icon: HelpCircle, label: "Central de ajuda", desc: "Tire suas dúvidas" },
      { icon: Bell, label: "Notificações", desc: "Alertas de pedidos e ofertas" },
      { icon: Settings, label: "Configurações", desc: "Preferências da conta" },
    ],
  },
];

function AccountPage() {
  const { user, isLoggedIn, logout, formatDocument } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
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
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 mb-8 ring-1 ring-primary/10">
            <User className="h-12 w-12 text-primary/40" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Faça login para continuar</h1>
          <p className="text-muted-foreground mt-2 mb-8 max-w-sm mx-auto">Acesse sua conta para ver pedidos, favoritos e muito mais.</p>
          <Link
            to="/entrar"
            search={{ tab: "login", redirect: "/minha-conta" }}
            className="inline-flex items-center gap-2 h-12 rounded-lg bg-primary text-primary-foreground font-semibold px-8 text-sm hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
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

  const DocIcon = user!.documentType === "cnpj" ? Building2 : UserCircle;
  const formattedDoc = formatDocument(user!.document, user!.documentType);

  return (
    <CustomerLayout maxWidth="1400" noPadding fullWidth>
      {/* ─── Full Red Block ─── */}
      <div className="bg-red-600 -mt-8 pt-12 sm:pt-14 pb-10 sm:pb-12 mb-0">
        <div className="max-w-[1400px] mx-auto">
          {/* Title row + Buttons */}
          <div className="px-4 sm:px-6 lg:px-[30px] mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">Minha conta</h1>
              <p className="text-white/50 text-sm mt-1">Gerencie seus dados e acompanhe seus pedidos</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-white/40 text-white bg-transparent text-xs font-bold px-4 sm:px-5 hover:bg-white/10 transition-all"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-black/30 text-white text-xs font-bold px-4 sm:px-5 hover:bg-black/50 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 sm:px-6 lg:px-[30px] space-y-5 border-t border-white/10 pt-5">
            {/* Avatar + Name + Contact */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-lg object-cover shadow-lg ring-2 ring-white/20" />
                ) : (
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-white text-red-700 text-xl font-black shadow-lg">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-red-600" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{user!.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white text-red-700 px-2.5 py-0.5 text-[11px] font-bold">
                    <Award className="h-3 w-3" />
                    {user!.documentType === "cnpj" ? "CNPJ" : "CPF"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 text-white/80 px-2.5 py-0.5 text-[11px] font-semibold">
                    <Clock className="h-3 w-3" />
                    Desde {new Date(user!.createdAt).getFullYear()}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 text-sm border-t border-white/10 pt-3 mt-3">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-white/50" />
                    <span className="text-white/80">{user!.email}</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-2">
                    <DocIcon className="h-3.5 w-3.5 text-white/50" />
                    <span className="text-white/80">{formattedDoc}</span>
                  </span>
                  {user!.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-white/50" />
                      <span className="text-white/80">{user!.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-[30px] pt-8 pb-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pedidos ativos", value: String(activeOrders.length), icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Favoritos", value: String(wishlistItems.length), icon: Heart, color: "text-rose-600 bg-rose-50" },
          { label: "Total gasto", value: formatCurrency(myOrders.reduce((s, o) => s + o.total, 0)), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total de pedidos", value: String(myOrders.length), icon: FileText, color: "text-violet-600 bg-violet-50" },
        ].map((s) => (
          <div key={s.label} className="rounded border border-border/40 bg-card p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {myOrders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pedidos recentes</h3>
            <button onClick={() => navigate({ to: "/minha-conta" })} className="text-xs text-primary font-medium hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {myOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="group rounded border border-border/40 bg-card p-5 hover:shadow-card-hover hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate({ to: `/pedido/${order.id}` })}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{order.id}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
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

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
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
                  className="group flex items-center gap-4 rounded border border-border/40 bg-card p-5 hover:border-primary/30 hover:shadow-card-hover transition-all text-left w-full"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary px-1.5">
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
