import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Ticket, Search, X, Percent, DollarSign, Truck, Loader2 } from "lucide-react";
import { useAdminCoupons, useSaveCoupon, useDeleteCoupon } from "@/lib/hooks";
import { generateId } from "@/lib/admin-store";
import { SELECT_CLASSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Coupon, CouponType } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cupons")({
  component: CouponsPage,
});

const typeLabels: Record<CouponType, string> = {
  percent: "Porcentagem",
  fixed: "Valor fixo",
  freeship: "Frete grátis",
};

const typeIcons: Record<CouponType, typeof Percent> = {
  percent: Percent,
  fixed: DollarSign,
  freeship: Truck,
};

function CouponsPage() {
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const saveCouponMutation = useSaveCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  const handleSave = (coupon: Coupon) => {
    saveCouponMutation.mutate(coupon, {
      onSuccess: () => {
        setModalOpen(false);
        setEditing(null);
        toast.success(editing ? "Cupom atualizado!" : "Cupom criado!");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCouponMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast.success("Cupom excluído!");
      },
    });
  };

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Cupons de Desconto</h1>
          <p className="text-sm text-zinc-500 mt-1">{coupons.length} cupom(ns) cadastrado(s)</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo cupom
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Nenhum cupom encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((coupon) => {
            const Icon = typeIcons[coupon.type];
            const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            return (
              <div
                key={coupon.id}
                className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-all ${
                  !coupon.active || expired ? "opacity-60 border-zinc-100" : "border-zinc-200 hover:shadow-sm"
                }`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${coupon.active && !expired ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 uppercase tracking-wide">{coupon.code}</span>
                    {coupon.active && !expired && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ATIVO</span>
                    )}
                    {expired && (
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">EXPIRADO</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {typeLabels[coupon.type]} •{" "}
                    {coupon.type === "percent"
                      ? `${coupon.value}% de desconto`
                      : coupon.type === "fixed"
                        ? `${formatCurrency(coupon.value)} de desconto`
                        : "Frete grátis"}
                    {coupon.minOrderValue > 0 && ` • Min: ${formatCurrency(coupon.minOrderValue)}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                    <span>Usos: {coupon.usedCount}/{coupon.maxUses > 0 ? coupon.maxUses : "∞"}</span>
                    {coupon.expiresAt && <span>Validade: {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(coupon); setModalOpen(true); }}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(coupon.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <CouponModal
          coupon={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-zinc-900">Excluir cupom?</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponModal({ coupon, onClose, onSave }: { coupon: Coupon | null; onClose: () => void; onSave: (c: Coupon) => void }) {
  const [code, setCode] = useState(coupon?.code || "");
  const [type, setType] = useState<CouponType>(coupon?.type || "percent");
  const [value, setValue] = useState(coupon?.value?.toString() || "10");
  const [minOrderValue, setMinOrderValue] = useState(coupon?.minOrderValue?.toString() || "0");
  const [maxUses, setMaxUses] = useState(coupon?.maxUses?.toString() || "0");
  const [perUserLimit, setPerUserLimit] = useState(coupon?.perUserLimit?.toString() || "1");
  const [active, setActive] = useState(coupon?.active ?? true);
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt?.split("T")[0] || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const newCoupon: Coupon = {
      id: coupon?.id || generateId(),
      code: code.trim().toUpperCase(),
      type,
      value: type === "freeship" ? 0 : parseFloat(value) || 0,
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxUses: parseInt(maxUses) || 0,
      usedCount: coupon?.usedCount || 0,
      perUserLimit: parseInt(perUserLimit) || 0,
      active,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      createdAt: coupon?.createdAt || new Date().toISOString(),
    };
    onSave(newCoupon);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-zinc-900 text-lg">{coupon ? "Editar cupom" : "Novo cupom"}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Código</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="DESCONTO10"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-bold uppercase tracking-wide outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Tipo de desconto</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(typeLabels) as CouponType[]).map((t) => {
                const Icon = typeIcons[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all ${
                      type === t ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {typeLabels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {type !== "freeship" && (
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">
                {type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
              </label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Pedido mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Validade</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Usos máximos (0 = ilimitado)</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Limite por cliente</label>
              <input
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50 transition-colors">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-zinc-900 h-4 w-4" />
            <span className="text-sm font-medium">Cupom ativo</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors">
              {coupon ? "Salvar" : "Criar cupom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
