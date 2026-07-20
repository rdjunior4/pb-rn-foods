import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useOrdersByCustomer } from "@/lib/hooks";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/minha-conta/pedidos")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrdersByCustomer(user?.id || "");

  if (!user) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground mb-4">Faça login para ver seus pedidos.</p>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: "Pendente", color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
    confirmed: { label: "Confirmado", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
    preparing: { label: "Preparando", color: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
    shipped: { label: "Enviado", color: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
    delivered: { label: "Entregue", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-700", dot: "bg-red-500" },
  };

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="h-3 w-3" /> Minha conta
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Meus Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe todas as suas compras.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando pedidos...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-semibold mb-1">Nenhum pedido realizado</p>
            <p className="text-xs text-muted-foreground mb-4">Quando você fizer uma compra, ela aparecerá aqui.</p>
            <Link to="/" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all">
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <div
                  key={order.id}
                  className="group rounded-xl border border-border/40 bg-card p-4 sm:p-5 hover:shadow-card-hover hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate({ to: `/pedido/${order.id}` })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{order.id}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-semibold ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.items.length} {order.items.length === 1 ? "item" : "itens"}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {order.couponCode && (
                    <div className="mt-2 text-[11px] text-emerald-600 font-medium">
                      Cupom: {order.couponCode}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
