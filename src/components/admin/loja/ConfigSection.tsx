import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loadStoreConfig, saveStoreConfig, defaultConfig } from "@/lib/store-config";
import type { StoreConfig } from "@/lib/store-config";
import { queryKeys } from "@/lib/query-keys";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function ConfigSection() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<StoreConfig>(() => loadStoreConfig());

  const handleSave = () => {
    saveStoreConfig(config);
    queryClient.invalidateQueries({ queryKey: queryKeys.storeConfig.all });
    toast.success("Configurações salvas");
  };
  const handleReset = () => {
    const reset = { ...defaultConfig };
    setConfig(reset);
    saveStoreConfig(reset);
    queryClient.invalidateQueries({ queryKey: queryKeys.storeConfig.all });
    toast.success("Configurações restauradas");
  };

  return (
    <div className="space-y-6">
      {/* Store Info */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-900">Informações da loja</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome da loja</label>
            <input
              value={config.storeName}
              onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição</label>
            <input
              value={config.storeDescription}
              onChange={(e) => setConfig({ ...config, storeDescription: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Telefone</label>
            <input
              value={config.storePhone}
              onChange={(e) => setConfig({ ...config, storePhone: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-mail</label>
            <input
              value={config.storeEmail}
              onChange={(e) => setConfig({ ...config, storeEmail: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Endereço</label>
            <input
              value={config.storeAddress}
              onChange={(e) => setConfig({ ...config, storeAddress: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Hero Config */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">Hero (Banner principal)</h2>
          {config.heroEnabled ? (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              Ativo
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400">
              Desativado
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.heroEnabled}
              onChange={(e) => setConfig({ ...config, heroEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-zinc-700">Exibir hero na página inicial</span>
          </label>
        </div>
        <p className="text-xs text-zinc-400 -mt-3">
          Configure os textos e botões do hero. Os textos aparecem quando não há banners, ou como
          fallback em cada banner.
        </p>
        <div
          className={`grid gap-4 sm:grid-cols-2 ${!config.heroEnabled ? "opacity-40 pointer-events-none" : ""}`}
        >
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Título do hero</label>
            <input
              value={config.heroTitle}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Subtítulo do hero
            </label>
            <textarea
              value={config.heroSubtitle}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Texto do botão CTA
            </label>
            <input
              value={config.heroCtaText}
              onChange={(e) => setConfig({ ...config, heroCtaText: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Link do botão CTA
            </label>
            <input
              value={config.heroCtaLink}
              onChange={(e) => setConfig({ ...config, heroCtaLink: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.heroSecondaryCtaEnabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    heroSecondaryCtaEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-zinc-700">
                Mostrar botão "Cadastre-se CNPJ"
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          <Save className="h-4 w-4" /> Salvar configurações
        </button>
        <button
          onClick={handleReset}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Restaurar padrão
        </button>
      </div>
    </div>
  );
}
