import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { loadStore, loadOrders } from "@/lib/admin-store";
import {
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  BoxSelect,
  Users,
  Clock,
  CalendarDays,
  ArrowDownRight,
  Percent,
  ExternalLink,
  Plus,
  Tags,
  Award,
  BarChart3,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/format";
import { DeliveryMap } from "@/components/admin/DeliveryMap";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Period = "today" | "7d" | "30d" | "90d" | "year" | "custom";

const periods: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "year", label: "Este ano" },
  { id: "custom", label: "Personalizado" },
];

function getPeriodRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date();
  const start = new Date();
  const end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(now.getDate() - 7);
  } else if (period === "30d") {
    start.setDate(now.getDate() - 30);
  } else if (period === "90d") {
    start.setDate(now.getDate() - 90);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "custom" && customStart && customEnd) {
    start.setTime(new Date(customStart).getTime());
    end.setTime(new Date(customEnd).setHours(23, 59, 59, 999));
  } else {
    start.setDate(now.getDate() - 30);
  }

  return { start, end };
}

function getPreviousPeriod(start: Date, end: Date) {
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return { prevStart, prevEnd };
}

function isInPeriod(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const statusDot: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  preparing: "bg-violet-500",
  shipped: "bg-indigo-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Separando",
  shipped: "Em trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function AdminDashboard() {
  const store = loadStore();
  const orders = loadOrders();

  const [period, setPeriod] = useState<Period>("30d");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const { start, end } = getPeriodRange(period, customStart, customEnd);
  const { prevStart, prevEnd } = getPreviousPeriod(start, end);

  const filteredOrders = useMemo(
    () => orders.filter((o) => isInPeriod(o.createdAt, start, end)),
    [orders, start.getTime(), end.getTime()],
  );

  const prevOrders = useMemo(
    () => orders.filter((o) => isInPeriod(o.createdAt, prevStart, prevEnd)),
    [orders, prevStart.getTime(), prevEnd.getTime()],
  );

  const paidOrders = filteredOrders.filter((o) => o.status !== "cancelled");
  const prevPaidOrders = prevOrders.filter((o) => o.status !== "cancelled");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevPaidOrders.reduce((s, o) => s + o.total, 0);
  const ticketMedio = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const prevTicketMedio = prevPaidOrders.length > 0 ? prevRevenue / prevPaidOrders.length : 0;
  const uniqueCustomers = new Set(paidOrders.map((o) => o.customerEmail || o.customerName)).size;
  const prevUniqueCustomers = new Set(prevPaidOrders.map((o) => o.customerEmail || o.customerName))
    .size;
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled").length;
  const cancelRate =
    filteredOrders.length > 0 ? (cancelledOrders / filteredOrders.length) * 100 : 0;

  const revenueChange = pctChange(totalRevenue, prevRevenue);
  const ordersChange = pctChange(filteredOrders.length, prevOrders.length);
  const ticketChange = pctChange(ticketMedio, prevTicketMedio);
  const customersChange = pctChange(uniqueCustomers, prevUniqueCustomers);

  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const topProducts = useMemo(() => {
    const soldMap = new Map<string, { name: string; qty: number; revenue: number }>();
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = soldMap.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          soldMap.set(item.productId, {
            name: item.productName,
            qty: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });
    });
    return Array.from(soldMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [paidOrders]);

  const revenueByCategory = useMemo(() => {
    const catMap = new Map<string, number>();
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = store.products.find((p) => p.id === item.productId);
        const catId = prod?.categoryId || "";
        const catObj = store.categories.find((c) => c.id === catId);
        const cat = catObj?.name || "Outros";
        catMap.set(cat, (catMap.get(cat) || 0) + item.price * item.quantity);
      });
    });
    return Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, receita]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), receita }));
  }, [paidOrders, store.products]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    const dayMs = 86400000;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    const useMonth = diffDays > 60;

    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = useMonth
        ? d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      map.set(key, (map.get(key) || 0) + o.total);
    });

    const entries = Array.from(map.entries());
    if (useMonth) {
      const monthOrder = [
        "jan",
        "fev",
        "mar",
        "abr",
        "mai",
        "jun",
        "jul",
        "ago",
        "set",
        "out",
        "nov",
        "dez",
      ];
      entries.sort((a, b) => {
        const aIdx = monthOrder.findIndex((m) => a[0].toLowerCase().includes(m));
        const bIdx = monthOrder.findIndex((m) => b[0].toLowerCase().includes(m));
        return aIdx - bIdx;
      });
    }

    return entries.map(([label, receita]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      receita,
    }));
  }, [paidOrders, start.getTime(), end.getTime()]);

  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [filteredOrders]);

  const stockData = store.products
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const outOfStock = store.products.filter((p) => p.stock === 0);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function TrendBadge({ value }: { value: number }) {
    const positive = value >= 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
          positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
        }`}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(value).toFixed(0)}%
      </span>
    );
  }

  const cards = [
    {
      label: "Faturamento",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      change: revenueChange,
      href: "/admin/pedidos",
      subtitle: `${paidOrders.length} pedido(s) pago(s)`,
    },
    {
      label: "Pedidos",
      value: String(filteredOrders.length),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      change: ordersChange,
      href: "/admin/pedidos",
      subtitle: pendingOrders > 0 ? `${pendingOrders} pendente(s)` : "Nenhum pendente",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(ticketMedio),
      icon: Percent,
      color: "text-violet-600",
      bg: "bg-violet-50",
      change: ticketChange,
      href: "/admin/pedidos",
      subtitle: `por pedido pago`,
    },
    {
      label: "Clientes",
      value: String(uniqueCustomers),
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
      change: customersChange,
      href: "/admin/clientes",
      subtitle: `${cancelRate.toFixed(0)}% cancelamento`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{greeting}, Admin</h1>
          <p className="text-sm text-zinc-500 mt-1 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 bg-white border border-zinc-200 rounded-lg px-3 py-2 hover:bg-zinc-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver loja
          </Link>
          <Link
            to="/admin/produtos/novo"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo produto
          </Link>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
            <CalendarDays className="h-4 w-4" />
            <span>Período:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  period === p.id
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-xs text-zinc-400">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className="group bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}
              >
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <TrendBadge value={c.change} />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{c.value}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{c.label}</div>
            <div className="text-xs text-zinc-400 mt-1.5">{c.subtitle}</div>
          </Link>
        ))}
      </div>

      {/* Pedidos por status */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">Pedidos por status</h2>
          <Link
            to="/admin/pedidos"
            className="text-xs text-zinc-500 hover:text-zinc-700 font-medium flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(
            [
              "pending",
              "confirmed",
              "preparing",
              "shipped",
              "delivered",
              "cancelled",
            ] as OrderStatus[]
          ).map((s) => (
            <div
              key={s}
              className="text-center p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
            >
              <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-2 ${statusDot[s]}`} />
              <div className="text-lg font-bold text-zinc-900">{ordersByStatus[s] || 0}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{statusLabel[s]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart - wider */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Receita</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {start.toLocaleDateString("pt-BR")} — {end.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {formatCurrency(totalRevenue)} total
              </span>
            </div>
          </div>
          {paidOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BoxSelect className="h-12 w-12 text-zinc-200 mb-3" />
              <p className="text-sm text-zinc-400">Nenhum pedido no período</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorReceita)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Category - narrower */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Por categoria</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Receita no período</p>
            </div>
            <BarChart3 className="h-5 w-5 text-zinc-300" />
          </div>
          {revenueByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Tags className="h-8 w-8 text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400">Sem dados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByCategory.map((cat) => {
                const max = revenueByCategory[0]?.receita || 1;
                const pct = (cat.receita / max) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-700">{cat.name}</span>
                      <span className="text-xs text-zinc-500">{formatCurrency(cat.receita)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mapa de Entregas */}
      <DeliveryMap orders={filteredOrders} />

      {/* Bottom Row: Top Products + Stock + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Produtos */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">Top produtos</h2>
            </div>
          </div>
          <div className="p-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Sem vendas no período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <span
                      className={`h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-zinc-50 text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-zinc-800 truncate block">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-zinc-400">{p.qty} vendido(s)</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-700">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estoque baixo */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  outOfStock.length > 0 ? "bg-red-50" : "bg-emerald-50"
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${outOfStock.length > 0 ? "text-red-600" : "text-emerald-600"}`}
                />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">Estoque</h2>
            </div>
            <Link
              to="/admin/produtos"
              className="text-xs text-zinc-500 hover:text-zinc-700 font-medium"
            >
              Ver todos
            </Link>
          </div>
          <div className="p-4">
            {stockData.length === 0 && outOfStock.length === 0 ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <Package className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-zinc-900">Estoque saudável</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Todos os produtos OK</p>
              </div>
            ) : (
              <div className="space-y-2">
                {outOfStock.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {outOfStock.length} produto(s) sem estoque
                    </div>
                    {outOfStock.slice(0, 3).map((p) => (
                      <div key={p.id} className="text-[11px] text-red-600 py-0.5">
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
                {stockData.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-xs text-zinc-700 truncate flex-1 mr-3">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-16 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.stock <= 2 ? "bg-red-500" : "bg-amber-400"}`}
                          style={{ width: `${Math.max(5, (p.stock / 10) * 100)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                          p.stock <= 2 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">Catálogo</h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-600">Produtos</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{store.products.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <Tags className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-600">Categorias</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{store.categories.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-600">Marcas</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{store.brands?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-600">Banners ativos</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">
                {store.banners.filter((b) => b.active).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Últimos pedidos</h2>
              <p className="text-[11px] text-zinc-400">{recentOrders.length} mais recentes</p>
            </div>
          </div>
          <Link
            to="/admin/pedidos"
            className="text-xs text-zinc-500 hover:text-zinc-700 font-medium flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-6">
              <ShoppingCart className="h-10 w-10 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Nenhum pedido no período</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  to="/admin/pedidos"
                  className="flex items-center justify-between text-sm rounded-lg px-4 py-3 -mx-1 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${statusDot[o.status]}`} />
                    <div className="min-w-0">
                      <span className="text-zinc-900 font-semibold text-xs">{o.id}</span>
                      <span className="text-zinc-400 mx-1.5">·</span>
                      <span className="text-zinc-500 text-xs truncate">{o.customerName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-[11px] text-zinc-400 hidden md:inline">
                      {formatDate(o.createdAt)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">
                      {formatCurrency(o.total)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
