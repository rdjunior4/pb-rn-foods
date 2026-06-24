import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { loadOrders, saveOrders, loadStore } from "@/lib/admin-store";
import { SELECT_CLASSES } from "@/lib/constants";
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
  Phone,
  FileText,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusConfig, statusSteps as statusOrder, nextStatus } from "@/lib/constants";
import { getPageRange } from "@/lib/pagination";
import { ITEMS_PER_PAGE_ADMIN } from "@/lib/constants";
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
});

const ITEMS_PER_PAGE = ITEMS_PER_PAGE_ADMIN;

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "advance" | "cancel";
    orderId: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  const refresh = () => setOrders(loadOrders());

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleAdvanceStatus = (id: string) => {
    const updated = orders.map((o) => {
      if (o.id !== id) return o;
      const next = nextStatus[o.status];
      if (!next) return o;
      return { ...o, status: next, updatedAt: new Date().toISOString() };
    });
    saveOrders(updated);
    refresh();
    setConfirmAction(null);
    const order = updated.find((o) => o.id === id);
    if (order) toast.success(`Pedido atualizado para "${statusConfig[order.status].label}"`);
  };

  const handleCancel = (id: string) => {
    const updated = orders.map((o) =>
      o.id === id && o.status !== "delivered" && o.status !== "cancelled"
        ? { ...o, status: "cancelled" as OrderStatus, updatedAt: new Date().toISOString() }
        : o,
    );
    saveOrders(updated);
    refresh();
    setConfirmAction(null);
    toast.success("Pedido cancelado");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmAction) setConfirmAction(null);
        else if (selectedId) setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, confirmAction]);

  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) : null;
  const confirmOrder = confirmAction ? orders.find((o) => o.id === confirmAction.orderId) : null;
  const distributors = useMemo(() => loadStore().distributors, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <p className="text-sm text-zinc-500 mt-1">{orders.length} pedidos no sistema</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className={SELECT_CLASSES.admin}
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum pedido recebido ainda</p>
          <p className="text-xs text-zinc-400 mt-1">Os pedidos dos clientes aparecerão aqui</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-sm text-zinc-400">Nenhum pedido encontrado para esta busca</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
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
                      <tr key={o.id} className="hover:bg-zinc-50/50 transition-colors">
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
                              className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                              title="Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {nextStatus[o.status] && (
                              <button
                                onClick={() => setConfirmAction({ type: "advance", orderId: o.id })}
                                className="h-9 px-3 rounded-xl text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                              >
                                Avançar
                              </button>
                            )}
                            {o.status !== "delivered" && o.status !== "cancelled" && (
                              <button
                                onClick={() => setConfirmAction({ type: "cancel", orderId: o.id })}
                                className="h-9 px-3 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
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
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
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
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Pedido {selectedOrder.id}</h2>
                <p className="text-sm text-zinc-400">{formatDate(selectedOrder.createdAt)}</p>
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
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="flex items-center gap-1">
                  {statusOrder.map((s) => {
                    const isComplete =
                      statusOrder.indexOf(s) <= statusOrder.indexOf(selectedOrder.status) &&
                      selectedOrder.status !== "cancelled";
                    const isCurrent =
                      s === selectedOrder.status && selectedOrder.status !== "cancelled";
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

              {/* Customer & Payment Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-zinc-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Cliente
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-zinc-500">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerDocument && (
                    <p className="text-sm text-zinc-500 mt-1">{selectedOrder.customerDocument}</p>
                  )}
                </div>
                <div className="bg-zinc-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Pagamento
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Endereço de entrega
                  </h3>
                </div>
                <p className="text-sm text-zinc-700">{selectedOrder.shippingAddress}</p>
                {selectedOrder.distributorId && (() => {
                  const dist = distributors.find((d) => d.id === selectedOrder.distributorId);
                  if (!dist) return null;
                  return (
                    <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-zinc-200">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: dist.color + "15" }}
                      >
                        <MapPin className="h-3.5 w-3.5" style={{ color: dist.color }} />
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

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Itens do pedido
                </h3>
                <div className="divide-y rounded-xl border border-zinc-200 overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white">
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover bg-zinc-100 shrink-0"
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

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedId(null)}
                className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-zinc-100"
              >
                Fechar
              </button>
              {nextStatus[selectedOrder.status] && (
                <button
                  onClick={() => setConfirmAction({ type: "advance", orderId: selectedOrder.id })}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors shadow-sm"
                >
                  Avançar para {statusConfig[nextStatus[selectedOrder.status]!].label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
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
                  <strong>{statusConfig[nextStatus[confirmOrder.status]!]?.label}</strong>.
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
                  <strong>{confirmOrder.customerName}</strong> será cancelado permanentemente.
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
