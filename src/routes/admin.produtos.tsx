import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useAdminProducts, useAdminCategories, useAdminBrands, useDeleteProduct, useBulkDeleteProducts } from "@/lib/hooks";
import { SELECT_CLASSES } from "@/lib/constants";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Search,
  Package,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  MoreHorizontal,
  Filter,
  Loader2,
} from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { getPageRange } from "@/lib/pagination";
import { ITEMS_PER_PAGE, PLACEHOLDER_IMAGE } from "@/lib/constants";
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

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

type SortField = "name" | "price" | "stock" | "brand";
type SortDir = "asc" | "desc";

function AdminProducts() {
  const matches = useMatches();
  const hasChildRoute = matches.some((m) => m.pathname.includes("/admin/produtos/novo") || m.pathname.includes("/admin/produtos/editar"));
  const { data: products = [], isLoading: productsLoading } = useAdminProducts();
  const { data: categories = [] } = useAdminCategories();
  const { data: brands = [] } = useAdminBrands();
  const deleteProductMutation = useDeleteProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }
    if (brandFilter !== "all") {
      result = result.filter((p) => p.brand === brandFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "price") cmp = a.price - b.price;
      else if (sortField === "stock") cmp = a.stock - b.stock;
      else if (sortField === "brand") cmp = a.brand.localeCompare(b.brand);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [products, debouncedSearch, categoryFilter, brandFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, brandFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((p) => p.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selected), {
      onSuccess: () => {
        setSelected(new Set());
        setBulkDelete(false);
        toast.success(`${selected.size} produto(s) removido(s)`);
      },
    });
  };

  const handleSingleDelete = () => {
    if (!deleteId) return;
    deleteProductMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast.success("Produto removido");
      },
    });
  };

  const deleteProduct = deleteId ? products.find((p) => p.id === deleteId) : null;

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 font-medium text-zinc-500 text-xs uppercase tracking-wider hover:text-zinc-700 transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${sortField === field ? "text-zinc-900" : "text-zinc-300"}`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {hasChildRoute ? (
        <Outlet />
      ) : (
        <>
      {productsLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      {!productsLoading && (<>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => setBulkDelete(true)}
              className="inline-flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {selected.size}
            </button>
          )}
          <Link
            to="/admin/produtos/novo"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={SELECT_CLASSES.compact}
            >
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className={SELECT_CLASSES.compact}
            >
              <option value="all">Todas as marcas</option>
              {brands
                .filter((b) => b.active)
                .map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum produto encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && selected.size === paginated.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                    </th>
                    <th className="text-left px-4 py-3">
                      <SortHeader field="name" label="Produto" />
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <SortHeader field="brand" label="Marca" />
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                    <th className="text-right px-4 py-3">
                      <SortHeader field="price" label="Preço" />
                    </th>
                    <th className="text-right px-4 py-3 hidden sm:table-cell">
                      <SortHeader field="stock" label="Estoque" />
                    </th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginated.map((p) => {
                    const cat = catMap.get(p.categoryId);
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-zinc-50/50 transition-colors ${selected.has(p.id) ? "bg-zinc-50/50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt=""
                              className="h-11 w-11 rounded-lg object-cover bg-zinc-100 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                              }}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-zinc-900 truncate max-w-[260px]">
                                {p.name}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5 font-mono">{p.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell">{p.brand}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {cat ? (
                            <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 rounded-full px-2.5 py-1 text-xs font-medium">
                              {cat.name}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.oldPrice ? (
                            <span className="text-zinc-400 line-through text-xs mr-1">
                              {formatCurrency(p.oldPrice)}
                            </span>
                          ) : null}
                          <span className="font-semibold text-zinc-900">
                            {formatCurrency(p.price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-amber-600" : "text-zinc-600"}`}
                          >
                            {p.stock === 0 && <AlertTriangle className="h-3 w-3" />}
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to="/admin/produtos/editar/$id"
                              params={{ id: p.id }}
                              className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
                Página {page} de {totalPages} ({filtered.length} resultados)
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
                          ? "bg-zinc-900 text-white"
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

      {/* Delete Dialogs */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir produto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deleteProduct?.name || "este produto"}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir {selected.size} produto(s)
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selected.size} produto(s)? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>)}
        </>
      )}
    </div>
  );
}
