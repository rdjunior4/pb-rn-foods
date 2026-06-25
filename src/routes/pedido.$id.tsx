import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  MapPin,
  CreditCard,
  Phone,
  FileText,
  ArrowLeft,
  Clock,
  ArrowRight,
  Store,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useOrderById, useOrderRealtime, useAdminDistributors } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/format";
import { CustomerLayout } from "@/components/CustomerLayout";
import { statusConfig, statusSteps } from "@/lib/constants";

export const Route = createFileRoute("/pedido/$id")({
  component: PedidoDetail,
});

function PedidoDetail() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useOrderById(id);
  useOrderRealtime(id);

  const { data: distributors = [] } = useAdminDistributors();
  const orderDist = useMemo(() => {
    if (!order?.distributorId) return null;
    return distributors.find((d) => d.id === order.distributorId) || null;
  }, [order, distributors]);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando pedido...</span>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="text-center py-24">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted mb-8">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Verifique se o número do pedido está correto.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-8 py-3.5 text-sm font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const status = statusConfig[order.status];
  const currentStepIdx = statusSteps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <CustomerLayout>
      <div className="mb-8">
        <Link
          to="/minha-conta"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus pedidos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedido {order.id}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Realizado em {formatDate(order.createdAt)}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${status.color}`}>
            {status.label}
          </div>
        </div>
      </div>

      {!isCancelled && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 mb-8">
          <h2 className="text-sm font-bold text-foreground mb-4">Acompanhamento</h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statusSteps.map((step, idx) => {
              const cfg = statusConfig[step];
              const done = idx <= currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : done
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cfg.label}
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço de entrega
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{order.shippingAddress}</p>
          {order.shippingCarrier && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Transportadora:</span>
              <span className="font-medium text-foreground">{order.shippingCarrier}</span>
            </div>
          )}
          {order.trackingCode && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rastreio:</span>
              <span className="font-mono font-medium text-foreground">{order.trackingCode}</span>
            </div>
          )}
          {orderDist && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 mt-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: orderDist.color }}>
                <Store className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{orderDist.name}</div>
                <div className="text-xs text-muted-foreground">{orderDist.city}/{orderDist.state}</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Pagamento
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Desconto {order.couponCode && `(${order.couponCode})`}</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span className="text-foreground">
                {order.shippingCost === 0 ? "Grátis" : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/40 pt-2">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-foreground text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm pt-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Método:</span>
            <span className="font-medium text-foreground capitalize">{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card p-6 mt-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Itens do pedido
        </h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 rounded-xl bg-muted/30 p-3">
              <img
                src={item.image || `https://picsum.photos/seed/${item.productName}/80/80`}
                alt={item.productName}
                className="h-14 w-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{item.productName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity}x — {formatCurrency(item.price)}
                </div>
              </div>
              <div className="text-sm font-bold text-foreground shrink-0">
                {formatCurrency(item.quantity * item.price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {order.customerPhone && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 mt-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Contato
          </h2>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
        </div>
      )}
    </CustomerLayout>
  );
}
