import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAdminOrders, useAdminAdvanceOrder } from "@/lib/hooks";
import { formatCurrency, formatDate, formatDocAuto, formatPhone } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Eye,
  ChevronRight,
  X,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { statusConfig, nextStatus } from "@/lib/constants";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientes,
});

const statusCardBg: Record<OrderStatus, string> = {
  pending: "bg-amber-50/50 border-amber-200",
  confirmed: "bg-blue-50/50 border-blue-200",
  preparing: "bg-violet-50/50 border-violet-200",
  shipped: "bg-indigo-50/50 border-indigo-200",
  delivered: "bg-emerald-50/50 border-emerald-200",
  cancelled: "bg-red-50/50 border-red-200",
};

interface CustomerSummary {
  email: string;
  name: string;
  document: string;
  phone: string;
  type: "cpf" | "cnpj" | "";
  totalOrders: number;
  totalSpent: number;
  latestOrderStatus: OrderStatus;
  latestOrderId: string;
  latestOrderDate: string;
  orders: Order[];
}

function AdminClientes() {
  const { data: orders = [], refetch } = useAdminOrders();
  const advanceOrderMutation = useAdminAdvanceOrder();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const o of sorted) {
      const key = o.customerEmail.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          email: o.customerEmail,
          name: o.customerName,
          document: o.customerDocument,
          phone: o.customerPhone || "",
          type:
            o.customerDocument?.length > 14 ? "cnpj" : o.customerDocument?.length > 0 ? "cpf" : "",
          totalOrders: 0,
          totalSpent: 0,
          latestOrderStatus: o.status,
          latestOrderId: o.id,
          latestOrderDate: o.createdAt,
          orders: [],
        });
      }
      const c = map.get(key)!;
      c.totalOrders++;
      c.totalSpent += o.total;
      c.orders.push(o);
    }
    for (const c of map.values()) {
      const activeOrders = c.orders.filter((o) => o.status !== "cancelled");
      if (activeOrders.length > 0) {
        const latest = activeOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        c.latestOrderStatus = latest.status;
        c.latestOrderId = latest.id;
        c.latestOrderDate = latest.createdAt;
      } else {
        c.latestOrderStatus = "cancelled";
        const latest = c.orders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        c.latestOrderId = latest.id;
        c.latestOrderDate = latest.createdAt;
      }
    }
    return Array.from(map.values());
  }, [orders]);

  const filtered = useMemo(() => {
    let result = customers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.document.includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.latestOrderStatus === statusFilter);
    }
    return result;
  }, [customers, search, statusFilter]);

  const pipelineGroups = useMemo(() => {
    const groups: Record<OrderStatus, CustomerSummary[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    };
    for (const c of filtered) {
      groups[c.latestOrderStatus].push(c);
    }
    return groups;
  }, [filtered]);

  const refresh = () => refetch();

  const handleAdvanceStatus = (orderId: string) => {
    advanceOrderMutation.mutate(orderId, {
      onSuccess: (order) => {
        refetch();
        setAdvancingOrderId(null);
        toast.success(`Pedido atualizado para "${statusConfig[order.status].label}"`);
        if (selectedCustomer) {
          const updatedOrders = orders.map((o) =>
            o.id === orderId ? order : o,
          ).filter(
            (o) => o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase(),
          );
          setSelectedCustomer({
            ...selectedCustomer,
            latestOrderStatus: order.status,
            orders: updatedOrders,
          });
        }
      },
      onError: (err) => {
        toast.error(`Erro: ${err.message}`);
      },
    });
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: customers.length };
    for (const c of customers) {
      counts[c.latestOrderStatus] = (counts[c.latestOrderStatus] || 0) + 1;
    }
    return counts;
  }, [customers]);

  const pipelineColumns: OrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} · Pipeline de pedidos
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1">
          <button
            onClick={() => setView("pipeline")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
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
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
              view === "table"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <List className="h-4 w-4" />
            Tabela
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Todos ({customers.length})
            </button>
            {pipelineColumns.map((s) => {
              const cfg = statusConfig[s];
              const count = statusCounts[s] || 0;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                    statusFilter === s
                      ? `${cfg.bg} ${cfg.color} ring-1 ring-current`
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      {view === "pipeline" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineColumns.map((status) => {
            const cfg = statusConfig[status];
            const items = pipelineGroups[status];
            return (
              <div key={status} className="flex flex-col">
                <div
                  className={`rounded-lg ${cfg.bg} px-3 py-2.5 mb-3 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${cfg.color} opacity-60`}>
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center">
                      <p className="text-xs text-zinc-400">Nenhum cliente</p>
                    </div>
                  ) : (
                    items.map((c) => (
                      <button
                        key={c.email}
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-md ${statusCardBg[status]} hover:scale-[1.01]`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-zinc-900 truncate max-w-[70%]">
                            {c.name}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                        </div>
                        <div className="text-xs text-zinc-500 truncate">{c.email}</div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50">
                          <span className="text-xs text-zinc-400">
                            {c.totalOrders} pedido{c.totalOrders !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs font-semibold text-zinc-700">
                            {formatCurrency(c.totalSpent)}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          {formatDate(c.latestOrderDate)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
              <div className="h-16 w-16 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-900">Nenhum cliente encontrado</p>
              <p className="text-xs text-zinc-400 mt-1">
                Os clientes aparecerão aqui quando houver pedidos
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                        Tipo
                      </th>
                      <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                        Documento
                      </th>
                      <th className="text-center px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                        Pedidos
                      </th>
                      <th className="text-right px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                        Total gasto
                      </th>
                      <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                        Status atual
                      </th>
                      <th className="text-right px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filtered.map((c) => {
                      const cfg = statusConfig[c.latestOrderStatus];
                      return (
                        <tr key={c.email} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-zinc-900 truncate max-w-[200px]">
                              {c.name}
                            </div>
                            <div className="text-xs text-zinc-400 truncate max-w-[200px]">
                              {c.email}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                c.type === "cnpj"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {c.type === "cnpj" ? "PJ" : "PF"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-500 hidden md:table-cell">
                            {formatDocAuto(c.document)}
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium text-zinc-700">
                            {c.totalOrders}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-zinc-900">
                            {formatCurrency(c.totalSpent)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color} ${cfg.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                              Ver detalhes
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[3vh] pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{selectedCustomer.name}</h2>
                <p className="text-sm text-zinc-400">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer Info Cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-xs text-zinc-400 mb-1">Documento</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatDocAuto(selectedCustomer.document)}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {selectedCustomer.type === "cnpj" ? "Pessoa Jurídica" : "Pessoa Física"}
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-xs text-zinc-400 mb-1">Telefone</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPhone(selectedCustomer.phone) || "—"}
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-xs text-zinc-400 mb-1">Total gasto</div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {selectedCustomer.totalOrders} pedido
                    {selectedCustomer.totalOrders !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-zinc-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status atual
                  </h3>
                  {nextStatus[selectedCustomer.latestOrderStatus] &&
                    (() => {
                      const next = nextStatus[selectedCustomer.latestOrderStatus]!;
                      const nextCfg = statusConfig[next];
                      return (
                        <button
                          onClick={() => setAdvancingOrderId(selectedCustomer.latestOrderId)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${nextCfg.bg} ${nextCfg.color} hover:opacity-80 transition-opacity`}
                        >
                          <ChevronRight className="h-3 w-3" />
                          Avançar para {nextCfg.label}
                        </button>
                      );
                    })()}
                </div>
                <div className="flex items-center gap-1">
                  {pipelineColumns.map((s, idx) => {
                    const cfg = statusConfig[s];
                    const currentIdx = pipelineColumns.indexOf(selectedCustomer.latestOrderStatus);
                    const isComplete =
                      idx <= currentIdx && selectedCustomer.latestOrderStatus !== "cancelled";
                    const isCurrent =
                      s === selectedCustomer.latestOrderStatus &&
                      selectedCustomer.latestOrderStatus !== "cancelled";
                    return (
                      <div key={s} className="flex-1">
                        <div
                          className={`h-2.5 rounded-full transition-colors ${
                            isCurrent ? cfg.dot : isComplete ? "bg-emerald-500" : "bg-zinc-200"
                          }`}
                        />
                        <div
                          className={`text-[10px] mt-1 text-center font-medium ${
                            isCurrent
                              ? cfg.color
                              : isComplete
                                ? "text-emerald-600"
                                : "text-zinc-400"
                          }`}
                        >
                          {cfg.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Orders History */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Histórico de pedidos ({selectedCustomer.orders.length})
                </h3>
                <div className="space-y-2">
                  {selectedCustomer.orders
                    .sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )
                    .map((order) => {
                      const cfg = statusConfig[order.status];
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3"
                        >
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                          >
                            {order.status === "delivered" ? (
                              <CheckCircle className={`h-4 w-4 ${cfg.color}`} />
                            ) : order.status === "cancelled" ? (
                              <AlertCircle className={`h-4 w-4 ${cfg.color}`} />
                            ) : order.status === "shipped" ? (
                              <Truck className={`h-4 w-4 ${cfg.color}`} />
                            ) : order.status === "preparing" ? (
                              <Package className={`h-4 w-4 ${cfg.color}`} />
                            ) : (
                              <Clock className={`h-4 w-4 ${cfg.color}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-900">
                                {order.id}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}
                              >
                                <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {formatDate(order.createdAt)} · {order.items.length} item
                              {order.items.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-zinc-900">
                              {formatCurrency(order.total)}
                            </div>
                            {nextStatus[order.status] && (
                              <button
                                onClick={() => handleAdvanceStatus(order.id)}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 mt-0.5"
                              >
                                Avançar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Advance Status */}
      {advancingOrderId &&
        (() => {
          const order = orders.find((o) => o.id === advancingOrderId);
          const next = order ? nextStatus[order.status] : null;
          if (!order || !next) return null;
          const cfg = statusConfig[next];
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setAdvancingOrderId(null)}
              />
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-bold text-zinc-900">Avançar status do pedido?</h3>
                <p className="text-sm text-zinc-500">
                  O pedido <strong>{order.id}</strong> será alterado de{" "}
                  <strong>{statusConfig[order.status].label}</strong> para{" "}
                  <strong>{cfg.label}</strong>.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setAdvancingOrderId(null)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAdvanceStatus(advancingOrderId)}
                    className={`text-sm font-semibold rounded-lg px-4 py-2 transition-colors ${cfg.bg} ${cfg.color}`}
                  >
                    Avançar para {cfg.label}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
