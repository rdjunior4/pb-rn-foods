import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Boxes, AlertTriangle, Search, TrendingDown, TrendingUp, Edit3, History, X, Loader2 } from "lucide-react";
import { useAdminProducts, useAdminStockMovements, useAdjustStock } from "@/lib/hooks";
import type { Product, StockMovement } from "@/lib/types";
import { SELECT_CLASSES } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/estoque")({
  component: StockPage,
});

function StockPage() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: movements = [] } = useAdminStockMovements();
  const adjustStockMutation = useAdjustStock();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "ok">("all");
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const LOW_THRESHOLD = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => {
        if (!q && filter === "all") return true;
        const matches = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        if (!matches) return false;
        if (filter === "low") return p.stock > 0 && p.stock <= LOW_THRESHOLD;
        if (filter === "out") return p.stock === 0;
        if (filter === "ok") return p.stock > LOW_THRESHOLD;
        return true;
      })
      .sort((a, b) => a.stock - b.stock);
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const out = products.filter((p) => p.stock === 0).length;
    const low = products.filter((p) => p.stock > 0 && p.stock <= LOW_THRESHOLD).length;
    const ok = products.filter((p) => p.stock > LOW_THRESHOLD).length;
    return { out, low, ok, total: products.length };
  }, [products]);

  const handleAdjust = (product: Product, newStock: number, reason: string) => {
    adjustStockMutation.mutate(
      { productId: product.id, newStock, reason: reason || "Ajuste manual" },
      {
        onSuccess: () => {
          toast.success(`Estoque atualizado: ${product.name} → ${newStock} un.`);
        },
      },
    );
  };

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Controle de Estoque</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerencie estoque, ajustes e movimentações</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
            <Boxes className="h-4 w-4" />
            Total
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
            <TrendingUp className="h-4 w-4" />
            Em estoque
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.ok}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
            <AlertTriangle className="h-4 w-4" />
            Estoque baixo
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.low}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
            <TrendingDown className="h-4 w-4" />
            Esgotado
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats.out}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className={SELECT_CLASSES.compact}
        >
          <option value="all">Todos</option>
          <option value="ok">Em estoque</option>
          <option value="low">Estoque baixo</option>
          <option value="out">Esgotado</option>
        </select>
      </div>

      <div className="grid gap-2">
        {filtered.map((product) => {
          const level = product.stock === 0 ? "out" : product.stock <= LOW_THRESHOLD ? "low" : "ok";
          const colors = {
            out: "border-red-200 bg-red-50/50",
            low: "border-amber-200 bg-amber-50/50",
            ok: "border-zinc-200 bg-white",
          };
          return (
            <div key={product.id} className={`flex items-center gap-4 rounded-xl border p-3.5 ${colors[level]}`}>
              <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-900 truncate">{product.name}</div>
                <div className="text-xs text-zinc-500">{product.brand}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${level === "out" ? "text-red-600" : level === "low" ? "text-amber-600" : "text-zinc-900"}`}>
                  {product.stock}
                </div>
                <div className="text-[10px] text-zinc-400 uppercase">unidades</div>
              </div>
              <button
                onClick={() => setHistoryProduct(product)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Histórico"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={() => setAdjustProduct(product)}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                <Edit3 className="h-3 w-3" />
                Ajustar
              </button>
            </div>
          );
        })}
      </div>

      {adjustProduct && (
        <AdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSave={handleAdjust}
        />
      )}

      {historyProduct && (
        <HistoryModal
          product={historyProduct}
          movements={movements.filter((m) => m.productId === historyProduct.id)}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
}

function AdjustModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product, stock: number, reason: string) => void }) {
  const [newStock, setNewStock] = useState(product.stock.toString());
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    onSave(product, stock, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900">Ajustar estoque</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
            <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-medium text-zinc-900">{product.name}</div>
              <div className="text-xs text-zinc-500">Estoque atual: {product.stock} un.</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Novo estoque</label>
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Motivo (opcional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Contagem física, perda, reposição..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ product, movements, onClose }: { product: Product; movements: StockMovement[]; onClose: () => void }) {
  const typeColors = {
    in: "text-emerald-600 bg-emerald-50",
    out: "text-red-600 bg-red-50",
    adjust: "text-zinc-600 bg-zinc-100",
  };
  const typeLabels = {
    in: "Entrada",
    out: "Saída",
    adjust: "Ajuste",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-zinc-900">Histórico de movimentações</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          {movements.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${typeColors[m.type]}`}>
                    {typeLabels[m.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900">
                      {m.previousStock} → {m.newStock} un.
                      {m.quantity > 0 && (
                        <span className={`ml-2 ${m.type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                          {m.type === "in" ? "+" : "-"}{m.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{m.reason}</div>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
