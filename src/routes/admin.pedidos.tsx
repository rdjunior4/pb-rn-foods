import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useAdminOrders,
  useAdminAdvanceOrder,
  useAdminCancelOrder,
  useAdminDistributors,
} from "@/lib/hooks";
import { saveOrders } from "@/lib/admin-store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { SELECT_CLASSES, ITEMS_PER_PAGE_ADMIN } from "@/lib/constants";
import {
  ShoppingBag,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  Save,
  Store,
  GripVertical,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusConfig, statusSteps as statusOrder, nextStatus, carriers } from "@/lib/constants";
import { getPageRange } from "@/lib/pagination";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
  errorComponent: () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-red-600 mb-2">Erro ao carregar</p>
      <p className="text-xs text-muted-foreground">Tente novamente ou volte para o painel.</p>
    </div>
  ),
});

const ITEMS_PER_PAGE = ITEMS_PER_PAGE_ADMIN;

const pipelineStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

const statusCardBg: Record<OrderStatus, string> = {
  pending: "bg-amber-50/50 border-amber-200",
  confirmed: "bg-blue-50/50 border-blue-200",
  preparing: "bg-violet-50/50 border-violet-200",
  shipped: "bg-indigo-50/50 border-indigo-200",
  delivered: "bg-emerald-50/50 border-emerald-200",
  cancelled: "bg-red-50/50 border-red-200",
};

function AdminOrders() {
  const { data: orders = [], isLoading, refetch } = useAdminOrders();
  const { data: distributors = [] } = useAdminDistributors();
  const advanceMutation = useAdminAdvanceOrder();
  const cancelMutation = useAdminCancelOrder();

  // ─── State ───
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [distributorFilter, setDistributorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "advance" | "cancel";
    orderId: string;
  } | null>(null);

  // Pipeline drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);

  // Detail panel (pipeline side panel)
  const [selected, setSelected] = useState<Order | null>(null);
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editEstDelivery, setEditEstDelivery] = useState("");

  // ─── Debounced search ───
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Filtered orders ───
  const filtered = useMemo(() => {
    let result = orders.filter((o) => o.status !== "cancelled");
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.trackingCode || "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (distributorFilter !== "all") {
      result = result.filter((o) => o.distributorId === distributorFilter);
    }
    return result;
  }, [orders, debouncedSearch, statusFilter, distributorFilter]);

  // ─── Sorted + paginated ───
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, distributorFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // ─── Pipeline groups ───
  const pipelineGroups = useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    };
    for (const o of filtered) {
      if (groups[o.status]) groups[o.status].push(o);
    }
    return groups;
  }, [filtered]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "delivered",
    );
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

  const distributorsMap = useMemo(
    () => new Map(distributors.map((d) => [d.id, d])),
    [distributors],
  );

  // ─── Handlers ───
  const handleAdvanceStatus = (id: string) => {
    advanceMutation.mutate(id, {
      onSuccess: (order: Order) => {
        toast.success(`Pedido atualizado para "${statusConfig[order.status].label}"`);
        setConfirmAction(null);
        if (selected?.id === id) {
          setSelected({ ...selected, status: order.status });
        }
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Pedido cancelado");
        setConfirmAction(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

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
        await supabase
          .from("orders")
          .update({
            shipping_carrier: editCarrier || null,
            tracking_code: editTracking || null,
            estimated_delivery: editEstDelivery || null,
          })
          .eq("id", orderId);
      }
    }
    refetch();
    setSelected(null);
    setEditCarrier("");
    setEditTracking("");
    setEditEstDelivery("");
    toast.success("Informações de envio salvas");
  };

  // ─── Keyboard ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmAction) setConfirmAction(null);
        else if (selected) setSelected(null);
        else if (selectedId) setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, confirmAction, selected]);

  // ─── Drag & Drop ───
  const handleDragStart = useCallback(
    (e: React.DragEvent, orderId: string) => {
      setDraggedId(orderId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", orderId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, status: OrderStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverStatus(status);
    },
    [],
  );

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
      handleAdvanceStatus(orderId);
    },
    [orders],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverStatus(null);
  }, []);

  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) : null;
  const confirmOrder = confirmAction
    ? orders.find((o) => o.id === confirmAction.orderId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {orders.length} pedidos no sistema
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1">
          <button
            onClick={() => setView("pipeline")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === "pipeline"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Pipeline
          </button>
          <button
            onClick={() => setView("table")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              view === "table"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
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
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
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
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
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
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
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
      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente, rastreio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className={SELECT_CLASSES.compact}
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
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

      {/* ═══════════════ PIPELINE VIEW ═══════════════ */}
      {view === "pipeline" && (
        <>
          <div className="flex gap-6 min-h-[500px]">
            {/* Kanban */}
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
                            <span className={`text-xs font-semibold ${cfg.color}`}>
                              {cfg.label}
                            </span>
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
                              const orderDist = order.distributorId ? distributorsMap.get(order.distributorId) : undefined;
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
                                    setEditEstDelivery(
                                      order.estimatedDelivery
                                        ? order.estimatedDelivery.split("T")[0]
                                        : "",
                                    );
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
                                    <span
                                      className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`}
                                    />
                                  </div>
                                  <div className="text-xs text-zinc-500 truncate">
                                    {order.customerName}
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-0.5">
                                    {formatDate(order.createdAt)}
                                  </div>
                                  {order.trackingCode && (
                                    <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">
                                      {order.trackingCode}
                                    </div>
                                  )}
                                  {orderDist && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Store
                                        className="h-2.5 w-2.5"
                                        style={{ color: orderDist.color }}
                                      />
                                      <span className="text-[10px] text-zinc-400 truncate">
                                        {orderDist.name}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50">
                                    <span className="text-xs text-zinc-400">
                                      {order.items.length} item
                                      {order.items.length !== 1 ? "s" : ""}
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

              {/* Side Panel */}
              {selected && (
                <div className="w-80 shrink-0 bg-white rounded-lg border border-zinc-200 overflow-hidden">
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
                          const isComplete =
                            idx <= currentIdx && selected.status !== "cancelled";
                          const isCurrent =
                            s === selected.status && selected.status !== "cancelled";
                          return (
                            <div key={s} className="flex-1">
                              <div
                                className={`h-2 rounded-full transition-colors ${
                                  isCurrent
                                    ? sCfg.dot
                                    : isComplete
                                      ? "bg-emerald-500"
                                      : "bg-zinc-200"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-[10px] font-semibold ${statusConfig[selected.status].color}`}
                        >
                          {statusConfig[selected.status].label}
                        </span>
                        {nextStatus[selected.status] && (
                          <button
                            onClick={() => {
                              setConfirmAction({
                                type: "advance",
                                orderId: selected.id,
                              });
                            }}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Avançar →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <InfoRow
                        icon={Package}
                        label="Itens"
                        value={`${selected.items.length} produto(s)`}
                      />
                      <InfoRow
                        icon={FileText}
                        label="Total"
                        value={formatCurrency(selected.total)}
                      />
                      {selected.distributorId && distributorsMap.get(selected.distributorId) && (
                        <InfoRow
                          icon={Store}
                          label="Distribuidora"
                          value={distributorsMap.get(selected.distributorId)!.name}
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

                    {/* Current tracking */}
                    {(selected.shippingCarrier ||
                      selected.trackingCode ||
                      selected.estimatedDelivery) && (
                      <div className="border-t border-zinc-100 pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                          Rastreio atual
                        </div>
                        <div className="space-y-1.5">
                          {selected.shippingCarrier && (
                            <div className="flex items-center gap-1.5">
                              <Truck className="h-3 w-3 text-zinc-400" />
                              <span className="text-xs text-zinc-600">
                                {carriers.find((c) => c.id === selected.shippingCarrier)
                                  ?.name || selected.shippingCarrier}
                              </span>
                            </div>
                          )}
                          {selected.trackingCode && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3 w-3 text-zinc-400" />
                              <span className="text-xs text-zinc-600 font-mono">
                                {selected.trackingCode}
                              </span>
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
        </>
      )}

      {/* ═══════════════ TABLE VIEW ═══════════════ */}
      {view === "table" && (
        <>
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
              <div className="h-16 w-16 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-900">Nenhum pedido recebido ainda</p>
              <p className="text-xs text-zinc-400 mt-1">
                Os pedidos dos clientes aparecerão aqui
              </p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
              <p className="text-sm text-zinc-400">Nenhum pedido encontrado para esta busca</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                          Pedido
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                          Cliente
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                          Data
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                          Total
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginated.map((o) => {
                        const cfg = statusConfig[o.status];
                        return (
                          <tr
                            key={o.id}
                            className="hover:bg-zinc-50/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedId(o.id)}
                                className="font-semibold text-zinc-900 hover:text-zinc-700 hover:underline"
                              >
                                {o.id}
                              </button>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="text-zinc-900 font-medium truncate max-w-[180px]">
                                {o.customerName}
                              </div>
                              <div className="text-xs text-zinc-400 truncate max-w-[180px]">
                                {o.customerEmail}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                              {formatDate(o.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color} ${cfg.bg}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                              {formatCurrency(o.total)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedId(o.id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                  title="Detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {nextStatus[o.status] && (
                                  <button
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "advance",
                                        orderId: o.id,
                                      })
                                    }
                                    className="h-9 px-3 rounded-lg text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                                  >
                                    Avançar
                                  </button>
                                )}
                                {o.status !== "delivered" && o.status !== "cancelled" && (
                                  <button
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "cancel",
                                        orderId: o.id,
                                      })
                                    }
                                    className="h-9 px-3 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-500">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {getPageRange(page, totalPages).map((p, i) =>
                      p === "ellipsis" ? (
                        <span
                          key={`e${i}`}
                          className="h-9 w-9 flex items-center justify-center text-zinc-400"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-blue-600 text-white"
                              : "text-zinc-500 hover:bg-zinc-50 border border-zinc-200"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════════════ DETAIL MODAL (table view) ═══════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Pedido {selectedOrder.id}
                </h2>
                <p className="text-sm text-zinc-400">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[selectedOrder.status].color} ${statusConfig[selectedOrder.status].bg}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusConfig[selectedOrder.status].dot}`}
                  />
                  {statusConfig[selectedOrder.status].label}
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="flex items-center gap-1">
                  {statusOrder.map((s) => {
                    const isComplete =
                      statusOrder.indexOf(s) <=
                        statusOrder.indexOf(selectedOrder.status) &&
                      selectedOrder.status !== "cancelled";
                    const isCurrent =
                      s === selectedOrder.status &&
                      selectedOrder.status !== "cancelled";
                    return (
                      <div key={s} className="flex-1">
                        <div
                          className={`h-2 rounded-full transition-colors ${
                            isComplete
                              ? isCurrent
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                              : "bg-zinc-200"
                          }`}
                        />
                        <div
                          className={`text-[10px] mt-1.5 text-center font-medium ${
                            isCurrent
                              ? "text-blue-600"
                              : isComplete
                                ? "text-emerald-600"
                                : "text-zinc-400"
                          }`}
                        >
                          {statusConfig[s].label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer & Payment */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-zinc-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Cliente
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">
                    {selectedOrder.customerName}
                  </p>
                  <p className="text-sm text-zinc-500">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerDocument && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {selectedOrder.customerDocument}
                    </p>
                  )}
                </div>
                <div className="bg-zinc-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Pagamento
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">
                    {selectedOrder.paymentMethod}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Endereço de entrega
                  </h3>
                </div>
                <p className="text-sm text-zinc-700">{selectedOrder.shippingAddress}</p>
                {selectedOrder.distributorId &&
                  (() => {
                    const dist = distributorsMap.get(selectedOrder.distributorId);
                    if (!dist) return null;
                    return (
                      <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-zinc-200">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: dist.color + "15" }}
                        >
                          <MapPin
                            className="h-3.5 w-3.5"
                            style={{ color: dist.color }}
                          />
                        </div>
                        <div className="text-sm">
                          <span className="text-zinc-500">Distribuidora: </span>
                          <span className="font-medium text-zinc-900">{dist.name}</span>
                          <span className="text-xs text-zinc-400 ml-1">
                            ({dist.city} — {dist.state})
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Tracking Info */}
              {(selectedOrder.shippingCarrier ||
                selectedOrder.trackingCode ||
                selectedOrder.estimatedDelivery) && (
                <div className="bg-zinc-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Rastreio
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {selectedOrder.shippingCarrier && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3 w-3 text-zinc-400" />
                        <span className="text-sm text-zinc-700">
                          {carriers.find(
                            (c) => c.id === selectedOrder.shippingCarrier,
                          )?.name || selectedOrder.shippingCarrier}
                        </span>
                      </div>
                    )}
                    {selectedOrder.trackingCode && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-zinc-400" />
                        <span className="text-sm text-zinc-700 font-mono">
                          {selectedOrder.trackingCode}
                        </span>
                      </div>
                    )}
                    {selectedOrder.estimatedDelivery && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        <span className="text-sm text-zinc-700">
                          Previsão: {formatDate(selectedOrder.estimatedDelivery)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Itens do pedido
                </h3>
                <div className="divide-y rounded-lg border border-zinc-200 overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-3 bg-white"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {item.quantity}x {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                <span className="text-base font-semibold text-zinc-900">Total</span>
                <span className="text-xl font-bold text-zinc-900">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedId(null)}
                className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-zinc-100"
              >
                Fechar
              </button>
              {nextStatus[selectedOrder.status] && (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "advance",
                      orderId: selectedOrder.id,
                    })
                  }
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors shadow-sm"
                >
                  Avançar para {statusConfig[nextStatus[selectedOrder.status]!].label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CONFIRM DIALOGS ═══════════════ */}
      <AlertDialog
        open={confirmAction?.type === "advance"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avançar status do pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOrder && (
                <>
                  O pedido <strong>{confirmOrder.id}</strong> será alterado de{" "}
                  <strong>{statusConfig[confirmOrder.status].label}</strong> para{" "}
                  <strong>
                    {statusConfig[nextStatus[confirmOrder.status]!]?.label}
                  </strong>
                  .
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleAdvanceStatus(confirmAction.orderId)}
            >
              Avançar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction?.type === "cancel"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Cancelar pedido?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOrder && (
                <>
                  O pedido <strong>{confirmOrder.id}</strong> de{" "}
                  <strong>{confirmOrder.customerName}</strong> será cancelado
                  permanentemente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter pedido</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleCancel(confirmAction.orderId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
