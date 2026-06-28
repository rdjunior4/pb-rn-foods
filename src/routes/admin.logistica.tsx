import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAdminOrders } from "@/lib/hooks";
import {
  Truck,
  Store,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  AlertCircle,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusConfig } from "@/lib/constants";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/logistica")({
  component: AdminLogistica,
});

function AdminLogistica() {
  const { data: orders = [] } = useAdminOrders();
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const delivery = orders.filter((o) => o.shippingCarrier === "propria");
    const pickup = orders.filter((o) => o.shippingCarrier === "retirada");
    const pending = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
    const preparing = orders.filter((o) => o.status === "preparing");
    const shipped = orders.filter((o) => o.status === "shipped");
    const delivered = orders.filter((o) => o.status === "delivered");

    const pendingDelivery = delivery.filter(
      (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing",
    );
    const pendingPickup = pickup.filter(
      (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing",
    );

    return {
      delivery: delivery.length,
      pickup: pickup.length,
      pending: pending.length,
      preparing: preparing.length,
      shipped: shipped.length,
      delivered: delivered.length,
      pendingDelivery,
      pendingPickup,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered");
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q),
      );
    }
    return result.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
    );
  }, [orders, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Logística</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Entregas próprias, retiradas e acompanhamento de envios
          </p>
        </div>
        <Link
          to="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg px-3 py-2 hover:bg-zinc-50 transition-colors"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Ver pipeline de pedidos
        </Link>
      </div>

      {/* ═══════ KPIs ═══════ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.delivery}</div>
              <div className="text-xs text-zinc-400">Entregas próprias</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Store className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.pickup}</div>
              <div className="text-xs text-zinc-400">Retiradas no local</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.preparing}</div>
              <div className="text-xs text-zinc-400">Separando agora</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.delivered}</div>
              <div className="text-xs text-zinc-400">Total entregues</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ═══════ Entregas Próprias pendentes ═══════ */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Entregas pendentes</h2>
              <p className="text-[11px] text-zinc-400">Pedidos que sairão para entrega</p>
            </div>
            {stats.pendingDelivery.length > 0 && (
              <span className="ml-auto bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {stats.pendingDelivery.length}
              </span>
            )}
          </div>
          {stats.pendingDelivery.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Nenhuma entrega pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[320px] overflow-y-auto">
              {stats.pendingDelivery.map((order) => {
                const cfg = statusConfig[order.status];
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{order.id}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{order.customerName}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                        {order.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {order.customerPhone}
                          </span>
                        )}
                        {order.shippingAddress && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{order.shippingAddress.split("|")[0].trim()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-zinc-900">{formatCurrency(order.total)}</div>
                      <div className="text-[10px] text-zinc-400">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════ Retiradas pendentes ═══════ */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Store className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Retiradas pendentes</h2>
              <p className="text-[11px] text-zinc-400">Pedidos aguardando retirada na loja</p>
            </div>
            {stats.pendingPickup.length > 0 && (
              <span className="ml-auto bg-violet-50 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-200">
                {stats.pendingPickup.length}
              </span>
            )}
          </div>
          {stats.pendingPickup.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Nenhuma retirada pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[320px] overflow-y-auto">
              {stats.pendingPickup.map((order) => {
                const cfg = statusConfig[order.status];
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{order.id}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{order.customerName}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                        {order.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {order.customerPhone}
                          </span>
                        )}
                        {order.customerDocument && (
                          <span className="flex items-center gap-1">
                            {order.customerDocument.length <= 14 ? "CPF" : "CNPJ"}: {order.customerDocument}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-zinc-900">{formatCurrency(order.total)}</div>
                      <div className="text-[10px] text-zinc-400">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ Todos os pedidos ativos ═══════ */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Pedidos ativos</h2>
              <p className="text-[11px] text-zinc-400">Todos os pedidos em andamento</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-56 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-900">Nenhum pedido ativo</p>
            <p className="text-xs text-zinc-400 mt-1">Todos os pedidos foram processados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Pedido</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Rastreio</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => {
                  const cfg = statusConfig[order.status];
                  const isDelivery = order.shippingCarrier === "propria";
                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-semibold text-zinc-900 text-xs">{order.id}</span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="text-zinc-900 font-medium truncate max-w-[160px] text-xs">{order.customerName}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isDelivery
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-violet-50 text-violet-700 border border-violet-200"
                        }`}>
                          {isDelivery ? <Truck className="h-2.5 w-2.5" /> : <Store className="h-2.5 w-2.5" />}
                          {isDelivery ? "Entrega" : "Retirada"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {order.trackingCode ? (
                          <span className="text-[11px] font-mono text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                            {order.trackingCode}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-zinc-900 text-xs">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to="/admin/pedidos"
                          className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          Gerenciar →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════ Info cards ═══════ */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Entrega Própria</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Pedidos entregues pela equipe própria. Configure o rastreio e a previsão de entrega na página de <strong>Pedidos</strong> usando o pipeline kanban.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-5">
          <div className="flex items-start gap-3">
            <Store className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-violet-900 mb-1">Retirada no Local</h3>
              <p className="text-xs text-violet-700 leading-relaxed">
                Pedidos que o cliente retira na loja. Ao marcar como "Separando", o cliente recebe notificação de que pode retirar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
