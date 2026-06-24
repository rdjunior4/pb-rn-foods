import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { loadStore, loadOrders } from "@/lib/admin-store";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCategories, getBrands } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/relatorios")({
  component: AdminRelatorios,
});

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#6366f1", "#14b8a6"];

function AdminRelatorios() {
  const store = loadStore();
  const orders = loadOrders();
  const categories = getCategories();
  const brands = getBrands();

  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const now = new Date();
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 9999;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const filteredOrders = useMemo(() =>
    orders.filter((o) => new Date(o.createdAt) >= startDate),
    [orders, period]
  );

  const completedOrders = filteredOrders.filter((o) => o.status === "delivered");
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled");
  const activeOrders = filteredOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const totalCancelledValue = cancelledOrders.reduce((s, o) => s + o.total, 0);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const revenueByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of completedOrders) {
      for (const item of o.items) {
        const product = store.products.find((p) => p.id === item.productId);
        const catId = product?.categoryId || "outros";
        const catName = categories.find((c) => c.id === catId)?.name || "Outros";
        map.set(catName, (map.get(catName) || 0) + item.price * item.quantity);
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [completedOrders, store.products, categories]);

  const revenueByBrand = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of completedOrders) {
      for (const item of o.items) {
        const product = store.products.find((p) => p.id === item.productId);
        const brandName = product?.brand || "Sem marca";
        map.set(brandName, (map.get(brandName) || 0) + item.price * item.quantity);
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [completedOrders, store.products]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of completedOrders) {
      for (const item of o.items) {
        const existing = map.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
        map.set(item.productId, {
          name: item.productName,
          qty: existing.qty + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [completedOrders]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filteredOrders) {
      const labels: Record<string, string> = {
        pending: "Pendente",
        confirmed: "Confirmado",
        preparing: "Separando",
        shipped: "Em trânsito",
        delivered: "Entregue",
        cancelled: "Cancelado",
      };
      const label = labels[o.status] || o.status;
      map[label] = (map[label] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of completedOrders) {
      const d = new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(d, (map.get(d) || 0) + o.total);
    }
    return Array.from(map.entries())
      .map(([date, receita]) => ({ date, receita }))
      .sort((a, b) => {
        const [da, ma] = a.date.split("/").map(Number);
        const [db, mb] = b.date.split("/").map(Number);
        return ma === mb ? da - db : ma - mb;
      });
  }, [completedOrders]);

  const exportCSV = () => {
    const lines = [
      "ID Pedido,Cliente,Email,Documento,Data,Status,Itens,Total",
      ...filteredOrders.map((o) =>
        [
          o.id,
          `"${o.customerName}"`,
          o.customerEmail,
          o.customerDocument,
          new Date(o.createdAt).toLocaleDateString("pt-BR"),
          o.status,
          o.items.length,
          o.total.toFixed(2),
        ].join(",")
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-pedidos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Relatórios</h1>
          <p className="text-sm text-zinc-500 mt-1">Análise de vendas e desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
            {(["7d", "30d", "90d", "all"] as const).map((p) => {
              const labels = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias", "all": "Tudo" };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    period === p ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500">Receita total</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-zinc-400 mt-1">{completedOrders.length} pedido(s) entregue(s)</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500">Ticket médio</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900">{formatCurrency(avgTicket)}</div>
          <div className="text-xs text-zinc-400 mt-1">Por pedido entregue</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500">Pedidos ativos</span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900">{activeOrders.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Em andamento</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500">Cancelados</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalCancelledValue)}</div>
          <div className="text-xs text-zinc-400 mt-1">{cancelledOrders.length} pedido(s)</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Day */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Faturamento diário</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Pedidos entregues</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          {revenueByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <BarChart3 className="h-8 w-8 mb-2" />
              <p className="text-sm">Sem dados no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 10 }} stroke="#a1a1aa" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelStyle={{ fontSize: 12 }} />
                <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by Status - Donut */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Pedidos por status</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{filteredOrders.length} pedido(s) no período</p>
            </div>
          </div>
          {ordersByStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Package className="h-8 w-8 mb-2" />
              <p className="text-sm">Sem dados no período</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} pedido(s)`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {ordersByStatus.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-zinc-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products & Revenue by Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Top produtos</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">Sem dados</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 truncate">{p.name}</div>
                    <div className="text-xs text-zinc-400">{p.qty} unidade(s)</div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Faturamento por categoria</h2>
          {revenueByCategory.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">Sem dados</div>
          ) : (
            <div className="space-y-3">
              {revenueByCategory.map((c, i) => {
                const max = revenueByCategory[0]?.value || 1;
                const pct = (c.value / max) * 100;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-700">{c.name}</span>
                      <span className="text-sm font-semibold text-zinc-900">{formatCurrency(c.value)}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Brand */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Faturamento por marca</h2>
        {revenueByBrand.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">Sem dados</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {revenueByBrand.map((b, i) => {
              const brandObj = brands.find((br) => br.name === b.name);
              return (
                <div key={b.name} className="rounded-lg border border-zinc-100 p-3 text-center">
                  {brandObj?.logo ? (
                    <img src={brandObj.logo} alt={b.name} className="h-8 mx-auto mb-2 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-zinc-100 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-400">{b.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="text-sm font-semibold text-zinc-900">{formatCurrency(b.value)}</div>
                  <div className="text-xs text-zinc-400">{b.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}