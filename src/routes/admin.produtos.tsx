import { createFileRoute, Link } from "@tanstack/react-router";
import { loadStore } from "@/lib/admin-store";
import { useState, useEffect } from "react";
import { Plus, Pencil, Search, Package } from "lucide-react";
import { getCategoryById } from "@/lib/data";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setProducts(loadStore().products);
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Package className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Produto</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Marca</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Preço</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Estoque</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => {
                  const cat = getCategoryById(p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover bg-zinc-100"
                          />
                          <div>
                            <div className="font-medium text-zinc-900 truncate max-w-[260px]">
                              {p.name}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell">{cat?.name || "-"}</td>
                      <td className="px-4 py-3 text-zinc-600 hidden md:table-cell">{p.brand}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {p.oldPrice ? (
                          <span className="text-zinc-400 line-through text-xs mr-1">R$ {p.oldPrice.toFixed(2)}</span>
                        ) : null}
                        <span className="text-zinc-900">R$ {p.price.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`text-sm ${p.stock === 0 ? "text-red-500" : "text-zinc-600"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/admin/produtos/editar/$id"
                          params={{ id: p.id }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
