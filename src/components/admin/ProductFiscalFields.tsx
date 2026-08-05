import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import {
  NCM_OPTIONS, CFOP_OPTIONS, CST_ICMS_OPTIONS, CST_PIS_COFINS_OPTIONS, ORIGEM_MERCADORIA_OPTIONS,
} from "@/lib/nfe-utils";
import { getProductFiscal, saveProductFiscal } from "@/lib/nfe-store";
import type { ProductFiscal } from "@/lib/types";

const inputClass = "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
const selectClass = "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

interface ProductFiscalFieldsProps {
  productId?: string;
  onChange?: (data: ProductFiscal) => void;
}

const defaultFiscal: ProductFiscal = {
  ncm: "2106.90.90",
  cest: "",
  cfopPadrao: "6102",
  origemMercadoria: 0,
  pesoLiquido: 0,
  pesoBruto: 0,
  icmsCst: "00",
  icmsAliquota: 0,
  pisCst: "01",
  pisAliquota: 1.65,
  cofinsCst: "01",
  cofinsAliquota: 7.6,
};

export function ProductFiscalFields({ productId, onChange }: ProductFiscalFieldsProps) {
  const [data, setData] = useState<ProductFiscal>(defaultFiscal);

  useEffect(() => {
    if (productId) {
      const existing = getProductFiscal(productId);
      if (existing) setData(existing);
    }
  }, [productId]);

  const update = (field: keyof ProductFiscal, value: string | number) => {
    const next = { ...data, [field]: value };
    setData(next);
    if (productId) saveProductFiscal(productId, next);
    onChange?.(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
          <FileText className="h-4 w-4 text-zinc-600" />
        </span>
        <h2 className="text-sm font-semibold text-zinc-900">Dados Fiscais</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* NCM */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">NCM (Nomenclatura Comum do Mercosul) *</label>
          <select value={data.ncm} onChange={(e) => update("ncm", e.target.value)} className={selectClass}>
            {NCM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            {!NCM_OPTIONS.some((o) => o.value === data.ncm) && data.ncm && (
              <option value={data.ncm}>{data.ncm}</option>
            )}
          </select>
        </div>

        {/* CEST */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">CEST (opcional)</label>
          <input value={data.cest} onChange={(e) => update("cest", e.target.value)} placeholder="00.000.00" className={inputClass} />
        </div>

        {/* CFOP */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">CFOP Padrão *</label>
          <select value={data.cfopPadrao} onChange={(e) => update("cfopPadrao", e.target.value)} className={selectClass}>
            {CFOP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Origem */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Origem da Mercadoria *</label>
          <select
            value={data.origemMercadoria}
            onChange={(e) => update("origemMercadoria", Number(e.target.value))}
            className={selectClass}
          >
            {ORIGEM_MERCADORIA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Peso */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Peso Líquido (kg)</label>
          <input
            type="number"
            step="0.001"
            value={data.pesoLiquido || ""}
            onChange={(e) => update("pesoLiquido", Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Peso Bruto (kg)</label>
          <input
            type="number"
            step="0.001"
            value={data.pesoBruto || ""}
            onChange={(e) => update("pesoBruto", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {/* ICMS */}
      <div className="border-t border-zinc-200 pt-5">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">ICMS</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CST</label>
            <select value={data.icmsCst} onChange={(e) => update("icmsCst", e.target.value)} className={selectClass}>
              {CST_ICMS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Alíquota (%)</label>
            <input
              type="number"
              step="0.01"
              value={data.icmsAliquota}
              onChange={(e) => update("icmsAliquota", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* PIS */}
      <div className="border-t border-zinc-200 pt-5">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">PIS</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CST</label>
            <select value={data.pisCst} onChange={(e) => update("pisCst", e.target.value)} className={selectClass}>
              {CST_PIS_COFINS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Alíquota (%)</label>
            <input
              type="number"
              step="0.01"
              value={data.pisAliquota}
              onChange={(e) => update("pisAliquota", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* COFINS */}
      <div className="border-t border-zinc-200 pt-5">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">COFINS</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CST</label>
            <select value={data.cofinsCst} onChange={(e) => update("cofinsCst", e.target.value)} className={selectClass}>
              {CST_PIS_COFINS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Alíquota (%)</label>
            <input
              type="number"
              step="0.01"
              value={data.cofinsAliquota}
              onChange={(e) => update("cofinsAliquota", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
