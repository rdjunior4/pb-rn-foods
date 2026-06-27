import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useAdminOrders, useAdminDistributors, useAdminAdvanceOrder } from "@/lib/hooks";
import { saveOrders } from "@/lib/admin-store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
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
  ChevronRight,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { statusConfig, carriers, nextStatus } from "@/lib/constants";

export const Route = createFileRoute("/admin/logistica")({
  component: AdminLogistica,
});

const pipelineStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered"];

const statusCardBg: Record<OrderStatus, string> = {
  pending: "bg-amber-50/50 border-amber-200",
  confirmed: "bg-blue-50/50 border-blue-200",
  preparing: "bg-violet-50/50 border-violet-200",
  shipped: "bg-indigo-50/50 border-indigo-200",
  delivered: "bg-emerald-50/50 border-emerald-200",
  cancelled: "bg-red-50/50 border-red-200",
};

function AdminLogistica() {
  const { data: orders = [], refetch } = useAdminOrders();
  const { data: distributorsRaw = [] } = useAdminDistributors();
  const distributors = useMemo(() => distributorsRaw.filter((d) => d.active), [distributorsRaw]);
  const advanceOrder = useAdminAdvanceOrder();

  const [search, setSearch] = useState("");
  const [distributorFilter, setDistributorFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editEstDelivery, setEditEstDelivery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);

  const filteredOrders = useMemo(() => {
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
    if (distributorFilter !== "all") {
      result = result.filter((o) => o.distributorId === distributorFilter);
    }
    return result;
  }, [orders, search, distributorFilter]);

  const pipelineGroups = useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    };
    for (const o of filteredOrders) {
      if (groups[o.status]) groups[o.status].push(o);
    }
    return groups;
  }, [filteredOrders]);

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

  const handleSaveShipping = async (orderId: string) => {
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
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("orders").update({
          shipping_carrier: editCarrier || null,
          tracking_code: editTracking || null,
          estimated_delivery: editEstDelivery || null,
        }).eq("id", orderId);
      }
    }
    refetch();
    setSelected(null);
    setEditCarrier("");
    setEditTracking("");
    setEditEstDelivery("");
    toast.success("Informações de envio salvas");
  };

  const handleAdvance = (orderId: string) => {
    advanceOrder.mutate(orderId, {
      onSuccess: (order) => {
        refetch();
        toast.success(`Pedido atualizado para "${statusConfig[order.status].label}"`);
        if (selected?.id === orderId) {
          setSelected({ ...selected, status: order.status });
        }
      },
    });
  };

  // Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    setDraggedId(orderId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", orderId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStatus(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStatus: OrderStatus) => {
      e.preventDefault();
      setDragOverStatus(null);
      const orderId = e.dataTransfer.getData("text/plain");
      if (!orderId) return;

      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === targetStatus) return;

      // Validar transição
      const allowedNext: Record<string, string[]> = {
        pending: ["confirmed"],
        confirmed: ["preparing"],
        preparing: ["shipped"],
        shipped: ["delivered"],
        delivered: [],
      };

      if (!allowedNext[order.status]?.includes(targetStatus)) {
        toast.error("Transição de status não permitida");
        return;
      }

      handleAdvance(orderId);
    },
    [orders, handleAdvance],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverStatus(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Logística</h1>
        <p className="text-sm text-zinc-500 mt-1">Pipeline de pedidos e tracking de envios</p>
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

      {/* Pipeline + Detail Panel */}
      <div className="flex gap-6 min-h-[500px]">
        {/* Pipeline Kanban */}
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-cols-5 gap-3 min-w-[800px]">
            {pipelineStatuses.map((status) => {
              const cfg = statusConfig[status];
              const items = pipelineGroups[status];
              const isOver = dragOverStatus === status;

              return (
                <div
                  key={status}
                  className="flex flex-col"
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div
                    className={`rounded-lg ${cfg.bg} px-3 py-2.5 mb-3 flex items-center justify-between transition-colors ${
                      isOver ? "ring-2 ring-zinc-900 ring-offset-1" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${cfg.color} opacity-60`}>
                      {items.length}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2 min-h-[200px]">
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center">
                        <p className="text-xs text-zinc-400">Arraste pedidos aqui</p>
                      </div>
                    ) : (
                      items.map((order) => {
                        const carrierObj = carriers.find((c) => c.id === order.shippingCarrier);
                        const orderDist = distributors.find((d) => d.id === order.distributorId);
                        const isDragging = draggedId === order.id;

                        return (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              setSelected(order);
                              setEditCarrier(order.shippingCarrier || "");
                              setEditTracking(order.trackingCode || "");
                              setEditEstDelivery(order.estimatedDelivery ? order.estimatedDelivery.split("T")[0] : "");
                            }}
                            className={`rounded-lg border p-3 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                              statusCardBg[status]
                            } ${isDragging ? "opacity-50 scale-95" : "hover:scale-[1.01]"} ${
                              selected?.id === order.id ? "ring-2 ring-zinc-900" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="h-3 w-3 text-zinc-300" />
                                <span className="text-sm font-semibold text-zinc-900 truncate max-w-[100px]">
                                  {order.id}
                                </span>
                              </div>
                              <span className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{order.customerName}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</div>
                            {order.trackingCode && (
                              <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">
                                {order.trackingCode}
                              </div>
                            )}
                            {orderDist && (
                              <div className="flex items-center gap-1 mt-1">
                                <Store className="h-2.5 w-2.5" style={{ color: orderDist.color }} />
                                <span className="text-[10px] text-zinc-400 truncate">{orderDist.name}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50">
                              <span className="text-xs text-zinc-400">
                                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                              </span>
                              <span className="text-xs font-semibold text-zinc-700">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{selected.id}</h3>
                <p className="text-xs text-zinc-400">{selected.customerName}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(500px-60px)]">
              {/* Status */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Status
                </div>
                <div className="flex items-center gap-1">
                  {pipelineStatuses.map((s, idx) => {
                    const sCfg = statusConfig[s];
                    const currentIdx = pipelineStatuses.indexOf(selected.status);
                    const isComplete = idx <= currentIdx && selected.status !== "cancelled";
                    const isCurrent = s === selected.status && selected.status !== "cancelled";
                    return (
                      <div key={s} className="flex-1">
                        <div
                          className={`h-2 rounded-full transition-colors ${
                            isCurrent ? sCfg.dot : isComplete ? "bg-emerald-500" : "bg-zinc-200"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-semibold ${statusConfig[selected.status].color}`}>
                    {statusConfig[selected.status].label}
                  </span>
                  {nextStatus[selected.status] && (
                    <button
                      onClick={() => handleAdvance(selected.id)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Avançar →
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <InfoRow icon={Package} label="Itens" value={`${selected.items.length} produto(s)`} />
                <InfoRow icon={FileText} label="Total" value={formatCurrency(selected.total)} />
                {distributors.find((d) => d.id === selected.distributorId) && (
                  <InfoRow
                    icon={Store}
                    label="Distribuidora"
                    value={distributors.find((d) => d.id === selected.distributorId)!.name}
                  />
                )}
              </div>

              {/* Shipping Edit */}
              <div className="border-t border-zinc-100 pt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Envio
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-zinc-500 mb-1 block">
                      Transportadora
                    </label>
                    <select
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      className={SELECT_CLASSES.compact}
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
                    <label className="text-[10px] font-medium text-zinc-500 mb-1 block">
                      Código de rastreio
                    </label>
                    <input
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      placeholder="Ex: BR123456789XX"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-zinc-500 mb-1 block">
                      Previsão de entrega
                    </label>
                    <input
                      type="date"
                      value={editEstDelivery}
                      onChange={(e) => setEditEstDelivery(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveShipping(selected.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Salvar envio
                  </button>
                </div>
              </div>

              {/* Current tracking display */}
              {(selected.shippingCarrier || selected.trackingCode || selected.estimatedDelivery) && (
                <div className="border-t border-zinc-100 pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Rastreio atual
                  </div>
                  <div className="space-y-1.5">
                    {selected.shippingCarrier && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3 w-3 text-zinc-400" />
                        <span className="text-xs text-zinc-600">
                          {carriers.find((c) => c.id === selected.shippingCarrier)?.name || selected.shippingCarrier}
                        </span>
                      </div>
                    )}
                    {selected.trackingCode && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-zinc-400" />
                        <span className="text-xs text-zinc-600 font-mono">{selected.trackingCode}</span>
                      </div>
                    )}
                    {selected.estimatedDelivery && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        <span className="text-xs text-zinc-600">
                          Previsão: {formatDate(selected.estimatedDelivery)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum pedido encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">Arraste pedidos entre colunas para alterar status</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-zinc-400" />
      <span className="text-[10px] text-zinc-400">{label}:</span>
      <span className="text-xs font-medium text-zinc-700">{value}</span>
    </div>
  );
}
