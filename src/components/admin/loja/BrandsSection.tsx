import { useState } from "react";
import { loadStoreConfig, saveStoreConfig } from "@/lib/store-config";
import { getBrands } from "@/lib/data";
import type { StoreConfig } from "@/lib/store-config";
import { Sparkles } from "lucide-react";

export function BrandsSection() {
  const [config, setConfig] = useState<StoreConfig>(() => loadStoreConfig());
  const allBrands = getBrands();

  const toggleBrand = (brandId: string) => {
    const next = config.featuredBrandIds.includes(brandId)
      ? {
          ...config,
          featuredBrandIds: config.featuredBrandIds.filter((id) => id !== brandId),
        }
      : { ...config, featuredBrandIds: [...config.featuredBrandIds, brandId] };
    saveStoreConfig(next);
    setConfig(next);
  };

  const selectAll = () => {
    const next = { ...config, featuredBrandIds: allBrands.map((b) => b.id) };
    saveStoreConfig(next);
    setConfig(next);
  };
  const selectNone = () => {
    const next = { ...config, featuredBrandIds: [] };
    saveStoreConfig(next);
    setConfig(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {config.featuredBrandIds.length} de {allBrands.length} marca(s) selecionada(s)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            Selecionar todas
          </button>
          <button
            onClick={selectNone}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            Desmarcar todas
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allBrands.map((brand) => {
          const selected = config.featuredBrandIds.includes(brand.id);
          return (
            <button
              key={brand.id}
              onClick={() => toggleBrand(brand.id)}
              className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md ${selected ? "border-primary ring-2 ring-primary/20" : "border-zinc-200 hover:border-zinc-300"}`}
            >
              <div className="flex items-center gap-3">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-8 w-8 rounded-lg object-contain bg-zinc-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {brand.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">{brand.name}</div>
                  <div className="text-xs text-zinc-400">{brand.slug}</div>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary bg-primary" : "border-zinc-300"}`}
                >
                  {selected && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {allBrands.length === 0 && (
        <div className="rounded-xl border border-zinc-200 p-12 text-center bg-white">
          <Sparkles className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-900">Nenhuma marca cadastrada</p>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre marcas na aba "Marcas" do menu lateral
          </p>
        </div>
      )}
    </div>
  );
}
