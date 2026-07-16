import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle, Package, Home, ClipboardList, MapPin, CreditCard, Phone, FileText, ArrowRight, Store } from "lucide-react";
import { useMemo } from "react";
import { useOrderById, useAdminDistributors } from "@/lib/hooks";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/pedido-confirmado")({
  component: PedidoConfirmado,
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
});

function PedidoConfirmado() {
  const { id } = Route.useSearch();
  const { data: order } = useOrderById(id);
  const { data: distributors = [] } = useAdminDistributors();
  const orderDist = useMemo(() => {
    if (!order?.distributorId) return null;
    return distributors.find((d) => d.id === order.distributorId) || null;
  }, [order, distributors]);

  return (
    <CustomerLayout variant="gradient" maxWidth="600">
      <div className="text-center py-8">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 mb-8 shadow-lg shadow-emerald-100">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">Pedido realizado!</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Seu pedido foi recebido e está sendo processado com sucesso.
        </p>

        {id && (
          <div className="inline-flex items-center gap-3 rounded-lg border border-border/40 bg-card px-6 py-4 mb-8 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Número do pedido</div>
              <div className="text-sm font-bold">{id}</div>
            </div>
          </div>
        )}

        {order && (
          <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 text-left shadow-sm">
            <h3 className="font-semibold mb-5 text-lg">Resumo do pedido</h3>

            <div className="space-y-3 mb-5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img src={item.image} alt={item.productName} className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.productName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.quantity}x {formatCurrency(item.price)}</div>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2 text-sm">
              {order.subtotal !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
              )}
              {order.discount !== undefined && order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.shippingCost !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  {order.shippingCost === 0 ? (
                    <span className="text-emerald-600 font-medium">Grátis</span>
                  ) : (
                    <span>{formatCurrency(order.shippingCost)}</span>
                  )}
                </div>
              )}
              <div className="border-t border-border/40 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="tracking-tight">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border/40 space-y-3 text-sm">
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{order.customerPhone}</span>
                </div>
              )}
              {order.customerDocument && (
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{order.customerDocument}</span>
                </div>
              )}
              {order.shippingAddress && (
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{order.shippingAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">{order.paymentMethod}</span>
              </div>
              {orderDist && (
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: orderDist.color + "15" }}
                  >
                    <Store className="h-4 w-4" style={{ color: orderDist.color }} />
                  </div>
                  <span className="text-muted-foreground">
                    Entrega: <span className="font-medium text-foreground">{orderDist.name}</span>
                    <span className="text-xs ml-1">({orderDist.city} — {orderDist.state})</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/40 bg-card p-6 mb-8 text-left shadow-sm">
          <h3 className="font-semibold mb-4">Próximos passos</h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">1</span>
              Você receberá um e-mail de confirmação com os detalhes do pedido.
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">2</span>
              Acompanhe o status do pedido na página "Meus pedidos".
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">3</span>
              Prepare-se para receber sua entrega!
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-card px-6 py-3.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
          <Link
            to="/minha-conta"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            <ClipboardList className="h-4 w-4" />
            Meus pedidos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
