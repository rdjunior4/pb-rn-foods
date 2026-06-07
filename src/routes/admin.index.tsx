import { createFileRoute, Link } from "@tanstack/react-router";
import { loadStore } from "@/lib/admin-store";
import { Package, Image, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const store = loadStore();
  const totalProducts = store.products.length;
  const activeBanners = store.banners.filter((b) => b.active).length;
  const totalStock = store.products.reduce((s, p) => s + p.stock, 0);
  const featuredCount = store.products.filter((p) => p.featured).length;

  const cards = [
    { label: "Produtos", value: totalProducts, icon: Package, href: "/admin/produtos", color: "text-blue-600 bg-blue-50" },
    { label: "Banners ativos", value: activeBanners, icon: Image, href: "/admin/banners", color: "text-violet-600 bg-violet-50" },
    { label: "Estoque total", value: `${totalStock} un`, icon: ShoppingCart, href: "/admin/produtos", color: "text-emerald-600 bg-emerald-50" },
    { label: "Destaques", value: featuredCount, icon: TrendingUp, href: "/admin/produtos", color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.color} mb-3`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{c.value}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-zinc-900">Produtos sem estoque</h2>
          <Link to="/admin/produtos" className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="p-6">
          {store.products.filter((p) => p.stock === 0).length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum produto sem estoque.</p>
          ) : (
            <div className="space-y-3">
              {store.products.filter((p) => p.stock === 0).slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 truncate">{p.name}</span>
                  <span className="text-red-500 font-medium text-xs ml-4">Sem estoque</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
