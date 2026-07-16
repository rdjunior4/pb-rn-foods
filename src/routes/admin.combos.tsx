import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Eye, EyeOff, Tag, ArrowUpDown, Search, ShoppingBag, Package, X, Check, GripVertical, Percent, Loader2 } from "lucide-react";
import { useAdminCombos, useSaveCombo, useDeleteCombo, useAdminProducts } from "@/lib/hooks";
import { generateId } from "@/lib/admin-store";
import { SELECT_CLASSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Combo, ComboItem } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/combos")({
  component: AdminCombosPage,
});

function AdminCombosPage() {
  const { data: combos = [], isLoading } = useAdminCombos();
  const { data: allProducts = [] } = useAdminProducts();
  const saveComboMutation = useSaveCombo();
  const deleteComboMutation = useDeleteCombo();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "discount" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(() => {
    let list = combos;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const cmp = sortBy === "name" ? a.name.localeCompare(b.name) :
                  sortBy === "discount" ? a.discountPercent - b.discountPercent :
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [combos, search, sortBy, sortDir]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteComboMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast.success("Combo removido");
      },
    });
  };

  const toggleActive = (combo: Combo) => {
    saveComboMutation.mutate({ ...combo, active: !combo.active });
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Combos</h1>
          <p className="text-sm text-zinc-500 mt-1">Crie kits com desconto para aumentar o ticket médio</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditing(null); }}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Combo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar combos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [s, d] = e.target.value.split("-");
            setSortBy(s as typeof sortBy);
            setSortDir(d as typeof sortDir);
          }}
          className={SELECT_CLASSES.compact}
        >
          <option value="createdAt-desc">Mais recentes</option>
          <option value="createdAt-asc">Mais antigos</option>
          <option value="name-asc">Nome A-Z</option>
          <option value="name-desc">Nome Z-A</option>
          <option value="discount-desc">Maior desconto</option>
          <option value="discount-asc">Menor desconto</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{combos.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-green-500" />
            <span className="text-xs text-zinc-500">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{combos.filter((c) => c.active).length}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-zinc-500">Desconto médio</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {combos.length > 0 ? Math.round(combos.reduce((sum, c) => sum + c.discountPercent, 0) / combos.length) : 0}%
          </p>
        </div>
      </div>

      {/* Combos list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-900 mb-1">Nenhum combo encontrado</p>
          <p className="text-xs text-zinc-500 mb-4">
            {search ? "Tente outro termo de busca" : "Crie seu primeiro combo para aumentar o ticket médio"}
          </p>
          {!search && (
            <button
              onClick={() => { setIsCreating(true); setEditing(null); }}
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar combo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((combo) => (
            <div
              key={combo.id}
              className={`bg-white rounded-lg border overflow-hidden transition-all ${
                combo.active ? "border-zinc-200 hover:shadow-md" : "border-zinc-100 opacity-60"
              }`}
            >
              <div className="flex items-stretch">
                {/* Items preview */}
                <div className="w-1/3 bg-muted/30 p-3 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-1 w-full">
                    {combo.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="aspect-square bg-white rounded border border-zinc-100 overflow-hidden flex items-center justify-center">
                        <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-zinc-900">{combo.name}</h3>
                      {combo.badge && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {combo.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{combo.description}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{combo.items.length} itens</p>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[10px] text-zinc-400 line-through">{formatCurrency(combo.originalTotal)}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(combo.comboPrice)}</p>
                      </div>
                      <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        -{combo.discountPercent}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(combo)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        title={combo.active ? "Ocultar" : "Mostrar"}
                      >
                        {combo.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => { setEditing(combo); setIsCreating(false); }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(combo.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || editing) && (
        <ComboForm
          combo={editing}
          products={allProducts}
          onSave={(combo) => {
            saveComboMutation.mutate(combo, {
              onSuccess: () => {
                setEditing(null);
                setIsCreating(false);
                toast.success(editing ? "Combo atualizado" : "Combo criado");
              },
            });
          }}
          onCancel={() => { setEditing(null); setIsCreating(false); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir combo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O combo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ComboForm({
  combo,
  products,
  onSave,
  onCancel,
}: {
  combo: Combo | null;
  products: { id: string; name: string; image: string; price: number }[];
  onSave: (combo: Combo) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(combo?.name || "");
  const [description, setDescription] = useState(combo?.description || "");
  const [badge, setBadge] = useState(combo?.badge || "");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(combo?.discountType || "percent");
  const [discountValue, setDiscountValue] = useState(combo?.discountValue?.toString() || "10");
  const [items, setItems] = useState<ComboItem[]>(combo?.items || []);
  const [searchProduct, setSearchProduct] = useState("");

  const filteredProducts = products.filter(
    (p: { id: string; name: string }) =>
      !items.some((i) => i.productId === p.id) &&
      p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addItem = (product: typeof products[0]) => {
    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        image: product.image,
        quantity: 1,
        unitPrice: product.price,
      },
    ]);
    setSearchProduct("");
  };

  const updateItem = (idx: number, field: keyof ComboItem, value: number | string) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const originalTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const numValue = parseFloat(discountValue) || 0;

  let comboPrice: number;
  let discountPercent: number;

  if (discountType === "percent") {
    const clampedPct = Math.min(Math.max(numValue, 0), 100);
    comboPrice = Math.round(originalTotal * (1 - clampedPct / 100) * 100) / 100;
    discountPercent = originalTotal > 0 ? Math.round((1 - comboPrice / originalTotal) * 100) : 0;
  } else {
    const fixedDiscount = Math.min(numValue, originalTotal);
    comboPrice = Math.round((originalTotal - fixedDiscount) * 100) / 100;
    discountPercent = originalTotal > 0 ? Math.round((fixedDiscount / originalTotal) * 100) : 0;
  }

  const handleSave = () => {
    if (!name.trim() || items.length === 0) return;
    const newCombo: Combo = {
      id: combo?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      items,
      originalTotal,
      comboPrice,
      discountType,
      discountValue: numValue,
      discountPercent,
      badge: badge.trim() || undefined,
      active: combo?.active ?? true,
      order: combo?.order ?? 0,
      createdAt: combo?.createdAt || new Date().toISOString(),
    };
    onSave(newCombo);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-zinc-900">
            {combo ? "Editar combo" : "Novo combo"}
          </h2>
          <button onClick={onCancel} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nome do combo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pringles & Paçoquita"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione combos ao carrinho e aproveite descontos especiais!"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Badge (opcional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: ATÉ 15% OFF"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Discount type */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Tipo de desconto *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  discountType === "percent"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <Percent className="h-4 w-4" />
                Porcentagem (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  discountType === "fixed"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <Tag className="h-4 w-4" />
                Preço fixo (R$)
              </button>
            </div>
            <div className="mt-2">
              <div className="relative">
                {discountType === "fixed" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">R$</span>
                )}
                <input
                  type="number"
                  min={0}
                  max={discountType === "percent" ? 100 : undefined}
                  step={discountType === "percent" ? 1 : 0.01}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "Ex: 15" : "Ex: 25,90"}
                  className={`w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    discountType === "fixed" ? "pl-10" : "pr-8"
                  }`}
                />
                {discountType === "percent" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
                )}
              </div>
              {discountType === "percent" && (
                <p className="text-[10px] text-zinc-400 mt-1">Máximo 100%</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Itens do combo *</label>

            {items.length > 0 && (
              <div className="space-y-2 mb-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                    <img src={item.image} alt="" className="h-10 w-10 rounded object-contain bg-white border border-zinc-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 truncate">{item.productName}</p>
                      <p className="text-[10px] text-zinc-400">{formatCurrency(item.unitPrice)}/un</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-zinc-500">Qtd:</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-12 px-1.5 py-1 text-xs text-center border border-zinc-200 rounded"
                      />
                    </div>
                    <div className="text-xs font-semibold text-zinc-900 w-20 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Buscar produto para adicionar..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-dashed border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {searchProduct && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {filteredProducts.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <img src={product.image} alt="" className="h-8 w-8 rounded object-contain bg-white border border-zinc-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-zinc-400">{formatCurrency(product.price)}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="px-3 py-4 text-xs text-zinc-400 text-center">Nenhum produto encontrado</p>
                )}
              </div>
            )}
          </div>

          {/* Price preview */}
          {items.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Preço original</p>
                  <p className="text-sm text-zinc-400 line-through">{formatCurrency(originalTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Economia</p>
                  <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {discountType === "percent" ? `-${numValue}%` : `-${formatCurrency(numValue)}`}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Preço do combo</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(comboPrice)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-zinc-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || items.length === 0}
            className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            {combo ? "Salvar alterações" : "Criar combo"}
          </button>
        </div>
      </div>
    </div>
  );
}
