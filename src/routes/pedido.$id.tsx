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
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { loadOrders, loadStore } from "@/lib/admin-store";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { CustomerLayout } from "@/components/CustomerLayout";
import { statusConfig, statusSteps } from "@/lib/constants";

export const Route = createFileRoute("/pedido/$id")({
  component: PedidoDetail,
});

function PedidoDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const distributors = useMemo(() => loadStore().distributors, []);
  const orderDist = useMemo(() => {
    if (!order?.distributorId) return null;
    return distributors.find((d) => d.id === order.distributorId) || null;
  }, [order, distributors]);

  useEffect(() => {
    const found = loadOrders().find((o) => o.id === id);
    setOrder(found || null);
  }, [id]);

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
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${status.color} ${status.bg} w-fit`}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>

      {!isCancelled && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            {statusSteps.map((step, idx) => {
              const cfg = statusConfig[step];
              const reached = idx <= currentStepIdx;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      reached
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-medium ${reached ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/40 bg-card p-6 mb-6 shadow-sm">
        <h3 className="font-semibold mb-5 text-lg">Itens do pedido</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <img
                src={item.image}
                alt={item.productName}
                className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.productName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity}x {formatCurrency(item.price)}
                </div>
              </div>
              <div className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-border/40 mt-5 pt-5 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="tracking-tight">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold">Entrega</h3>
          </div>
          {order.shippingAddress && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              {order.shippingAddress}
            </div>
          )}
          {orderDist && (
            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-border/40">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: orderDist.color + "15" }}
              >
                <Store className="h-3.5 w-3.5" style={{ color: orderDist.color }} />
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Distribuidora: </span>
                <span className="font-medium text-foreground">{orderDist.name}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({orderDist.city} — {orderDist.state})
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>
            <h3 className="font-semibold">Pagamento</h3>
          </div>
          <div className="text-sm text-muted-foreground">{order.paymentMethod}</div>
          {order.customerPhone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Phone className="h-3.5 w-3.5" />
              {order.customerPhone}
            </div>
          )}
          {order.customerDocument && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <FileText className="h-3.5 w-3.5" />
              {order.customerDocument}
            </div>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 flex items-center gap-3 shadow-sm">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shrink-0">
            <Package className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <div className="font-semibold">Pedido cancelado</div>
            <div className="text-red-600/80 text-xs mt-0.5">
              Este pedido foi cancelado e não será entregue.
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Link
          to="/minha-conta"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-8 py-3.5 text-sm font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          Ver todos os pedidos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </CustomerLayout>
  );
}
