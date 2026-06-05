import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Package, Heart, MapPin, Settings, LogOut, User, ShoppingCart,
  Clock, FileText, Phone, Mail, CreditCard, Building2, UserCircle,
  ChevronRight, Award, TrendingUp, DollarSign,
  HelpCircle, Bell, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
      { icon: Package, label: "Meus pedidos", desc: "Acompanhe suas compras", badge: "2" },
      { icon: ShoppingCart, label: "Carrinhos salvos", desc: "Retome compras pendentes", route: "/carrinho" },
    ],
  },
  {
    title: "Favoritos",
    items: [
      { icon: Heart, label: "Lista de desejos", desc: "Produtos favoritados" },
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
  const navigate = useNavigate();

  const handleSoon = (label: string) => {
    toast.info(`"${label}" estará disponível em breve`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-muted/30">
        <TopBar /><Header />
        <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6 ring-1 ring-border/50">
            <User className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Faça login para continuar</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Acesse sua conta para ver pedidos, favoritos e mais.</p>
          <Link
            to="/entrar"
            className="inline-flex items-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-semibold px-8 text-sm hover:bg-primary-hover transition-all active:scale-[0.98]"
          >
            Entrar agora
            <ChevronRight className="h-4 w-4" />
          </Link>
        </main>
        <Footer />
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 lg:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{user!.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold">
                      <Award className="h-3 w-3" />
                      {user!.documentType === "cnpj" ? "CNPJ" : "CPF"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium">
                      <Clock className="h-3 w-3" />
                      Desde {new Date(user!.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSoon("Edição de perfil")}
                  className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-border/60 text-xs font-medium px-3.5 hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground px-3.5 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-foreground/40" />
                  {user!.email}
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <DocIcon className="h-4 w-4 text-foreground/40" />
                  {formattedDoc}
                </span>
                {user!.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-foreground/40" />
                    {user!.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Pedidos ativos", value: "2" },
            { label: "Favoritos", value: "5" },
            { label: "Total gasto", value: "R$ 0,00" },
            { label: "Lista de desejos", value: "5 itens" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg font-bold mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => item.route ? navigate({ to: item.route as any }) : handleSoon(item.label)}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left w-full"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      <item.icon className="h-4 w-4" />
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
      </main>
      <Footer />
    </div>
  );
}