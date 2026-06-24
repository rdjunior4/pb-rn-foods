import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { loadOrders, saveOrders, loadStore } from "@/lib/admin-store";
import { SELECT_CLASSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  Search,
  MapPin,
  FileText,
  Save,
  X,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { statusConfig, carriers } from "@/lib/constants";

export const Route = createFileRoute("/admin/logistica")({
  component: AdminLogistica,
});

function AdminLogistica() {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "shipping" | "all">("all");
  const [distributorFilter, setDistributorFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editEstDelivery, setEditEstDelivery] = useState("");

  const distributors = useMemo(() => loadStore().distributors.filter((d) => d.active), []);

  const shippingOrders = useMemo(() => {
    let result = orders.filter((o) => o.status !== "cancelled");
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.trackingCode || "").toLowerCase().includes(q),
      );
    }
    if (statusFilter === "shipping") {
      result = result.filter((o) => o.status === "preparing" || o.status === "shipped");
    } else if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (distributorFilter !== "all") {
      result = result.filter((o) => o.distributorId === distributorFilter);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter, distributorFilter]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered");
    const withTracking = orders.filter((o) => o.trackingCode);
    const preparing = orders.filter((o) => o.status === "preparing");
    const shipped = orders.filter((o) => o.status === "shipped");
    return {
      preparing: preparing.length,
      shipped: shipped.length,
      withTracking: withTracking.length,
      active: active.length,
    };
  }, [orders]);

  const handleSaveShipping = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        shippingCarrier: editCarrier || o.shippingCarrier,
        trackingCode: editTracking || o.trackingCode,
        estimatedDelivery: editEstDelivery || o.estimatedDelivery,
        updatedAt: new Date().toISOString(),
      };
    });
    saveOrders(updated);
    setOrders(updated);
    setEditingId(null);
    setEditCarrier("");
    setEditTracking("");
    setEditEstDelivery("");
    toast.success("Informações de envio salvas");
  };

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditCarrier(order.shippingCarrier || "");
    setEditTracking(order.trackingCode || "");
    setEditEstDelivery(order.estimatedDelivery ? order.estimatedDelivery.split("T")[0] : "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Logística</h1>
        <p className="text-sm text-zinc-500 mt-1">Acompanhamento de envios e entregas</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.preparing}</div>
              <div className="text-xs text-zinc-400">Separando</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.shipped}</div>
              <div className="text-xs text-zinc-400">Em trânsito</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.withTracking}</div>
              <div className="text-xs text-zinc-400">Com rastreio</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.active}</div>
              <div className="text-xs text-zinc-400">Ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar pedido, cliente, rastreio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "all" as const, label: "Todos" },
              { value: "shipping" as const, label: "Em separação/trânsito" },
              { value: "preparing" as const, label: "Separando" },
              { value: "shipped" as const, label: "Em trânsito" },
              { value: "delivered" as const, label: "Entregues" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  statusFilter === f.value
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {distributors.length > 0 && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-zinc-400" />
              <select
                value={distributorFilter}
                onChange={(e) => setDistributorFilter(e.target.value)}
                className={SELECT_CLASSES.compact}
              >
                <option value="all">Todas distribuidoras</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      {shippingOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum pedido encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">Os pedidos em andamento aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shippingOrders.map((order) => {
            const cfg = statusConfig[order.status];
            const carrierObj = carriers.find((c) => c.id === order.shippingCarrier);
            const isEditing = editingId === order.id;
            const orderDist = distributors.find((d) => d.id === order.distributorId);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
              >
                {/* Order Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() => (isEditing ? null : startEdit(order))}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                    >
                      {order.status === "shipped" ? (
                        <Truck className={`h-5 w-5 ${cfg.color}`} />
                      ) : order.status === "delivered" ? (
                        <CheckCircle className={`h-5 w-5 ${cfg.color}`} />
                      ) : order.status === "preparing" ? (
                        <Package className={`h-5 w-5 ${cfg.color}`} />
                      ) : (
                        <Clock className={`h-5 w-5 ${cfg.color}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{order.id}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {order.customerName} · {formatDate(order.createdAt)}
                        {orderDist && (
                          <span className="ml-1.5 inline-flex items-center gap-1">
                            · <Store className="h-3 w-3" style={{ color: orderDist.color }} />
                            {orderDist.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-xs text-zinc-400">{order.items.length} item(s)</div>
                  </div>
                </div>

                {/* Shipping Info / Edit */}
                {isEditing ? (
                  <div className="border-t border-zinc-100 px-5 py-4 bg-zinc-50/50 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Transportadora
                        </label>
                        <select
                          value={editCarrier}
                          onChange={(e) => setEditCarrier(e.target.value)}
                          className={SELECT_CLASSES.admin}
                        >
                          <option value="">Selecione</option>
                          {carriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.days})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Código de rastreio
                        </label>
                        <input
                          value={editTracking}
                          onChange={(e) => setEditTracking(e.target.value)}
                          placeholder="Ex: BR123456789XX"
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Previsão de entrega
                        </label>
                        <input
                          type="date"
                          value={editEstDelivery}
                          onChange={(e) => setEditEstDelivery(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveShipping(order.id)}
                        className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-800 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditCarrier("");
                          setEditTracking("");
                          setEditEstDelivery("");
                        }}
                        className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50/30">
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      {order.shippingCarrier ? (
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-600">
                            {carrierObj?.name || order.shippingCarrier}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-zinc-300" />
                          <span className="text-xs text-zinc-400">Sem transportadora</span>
                        </div>
                      )}
                      {order.trackingCode ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-600 font-mono">
                            {order.trackingCode}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-zinc-300" />
                          <span className="text-xs text-zinc-400">Sem rastreio</span>
                        </div>
                      )}
                      {order.estimatedDelivery && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-600">
                            Previsão: {formatDate(order.estimatedDelivery)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
