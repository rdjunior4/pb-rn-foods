import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Image, ShieldCheck, Store, LayoutGrid } from "lucide-react";
import { BannersSection } from "@/components/admin/loja/BannersSection";
import { BenefitsSection } from "@/components/admin/loja/BenefitsSection";
import { ConfigSection } from "@/components/admin/loja/ConfigSection";
import { LayoutBuilder } from "@/components/admin/LayoutBuilder";
import { loadStoreConfig, saveStoreConfig } from "@/lib/store-config";
import type { StoreConfig } from "@/lib/store-config";

export const Route = createFileRoute("/admin/loja")({
  component: AdminLoja,
});

type Tab = "banners" | "layout" | "benefits" | "config";

function AdminLoja() {
  const [tab, setTab] = useState<Tab>("banners");
  const [config, setConfig] = useState<StoreConfig>(() => loadStoreConfig());

  const handleConfigChange = (newConfig: StoreConfig) => {
    setConfig(newConfig);
    saveStoreConfig(newConfig);
  };

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "banners", label: "Banners", icon: Image },
    { id: "layout", label: "Layout", icon: LayoutGrid },
    { id: "benefits", label: "Benefícios", icon: ShieldCheck },
    { id: "config", label: "Configurações", icon: Store },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Minha Loja</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Configure a aparência e conteúdo da sua vitrine
        </p>
      </div>

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              tab === t.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "layout" && (
        <LayoutBuilder config={config} onChange={handleConfigChange} />
      )}
      {tab === "banners" && <BannersSection />}
      {tab === "benefits" && <BenefitsSection />}
      {tab === "config" && <ConfigSection />}
    </div>
  );
}
