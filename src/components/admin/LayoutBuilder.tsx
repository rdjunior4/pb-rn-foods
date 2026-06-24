import { useState } from "react";
import { loadStoreConfig, saveStoreConfig, generateSectionId, sectionTypeLabels } from "@/lib/store-config";
import type { StoreConfig, StoreSection, SectionType } from "@/lib/store-config";
import { getCategories } from "@/lib/data";
import {
  GripVertical, Eye, EyeOff, Trash2, Settings, X,
  Image, Award, ShieldCheck, Tag, Package, Mail,
  LayoutGrid, Code, ChevronRight, Plus, Type,
  Star, ShoppingBag, Newspaper, Hash, Timer, MessageSquare,
  Monitor, Smartphone,
} from "lucide-react";

const sectionIcons: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  "hero": Image,
  "brands": Award,
  "benefits": ShieldCheck,
  "offer-products": Tag,
  "category-products": Package,
  "combos": ShoppingBag,
  "newsletter": Mail,
  "categories-grid": LayoutGrid,
  "custom-html": Code,
};

const componentGroups = [
  {
    label: "COMPONENTES",
    items: [
      { type: "hero" as SectionType, label: "Banner", icon: Image },
      { type: "offer-products" as SectionType, label: "Ofertas", icon: Tag },
      { type: "category-products" as SectionType, label: "Produtos", icon: Package },
      { type: "combos" as SectionType, label: "Combos", icon: ShoppingBag },
      { type: "brands" as SectionType, label: "Marcas", icon: Award },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [
      { type: "benefits" as SectionType, label: "Vantagens", icon: ShieldCheck },
      { type: "categories-grid" as SectionType, label: "Categorias", icon: LayoutGrid },
      { type: "newsletter" as SectionType, label: "Newsletter", icon: Mail },
      { type: "custom-html" as SectionType, label: "HTML", icon: Code },
    ],
  },
];

const sectionPreviews: Record<SectionType, { bg: string; label: string }> = {
  "hero": { bg: "from-zinc-800 to-zinc-600", label: "Banner Principal" },
  "brands": { bg: "from-zinc-100 to-zinc-50", label: "Marcas" },
  "benefits": { bg: "from-primary/10 to-primary/5", label: "Benefícios" },
  "offer-products": { bg: "from-amber-50 to-orange-50", label: "Ofertas" },
  "category-products": { bg: "from-blue-50 to-indigo-50", label: "Produtos" },
  "combos": { bg: "from-orange-50 to-amber-50", label: "Combos" },
  "newsletter": { bg: "from-emerald-50 to-teal-50", label: "Newsletter" },
  "categories-grid": { bg: "from-violet-50 to-purple-50", label: "Categorias" },
  "custom-html": { bg: "from-zinc-50 to-zinc-100", label: "Personalizado" },
};

function SectionMiniPreview({ section }: { section: StoreSection }) {
  const preview = sectionPreviews[section.type];

  switch (section.type) {
    case "hero":
      return (
        <div className="bg-gradient-to-r from-primary to-red-500 p-4 min-h-[100px] flex items-center">
          <div className="flex-1">
            <div className="h-3 w-32 bg-white/20 rounded mb-2" />
            <div className="h-2 w-48 bg-white/10 rounded mb-1" />
            <div className="h-2 w-36 bg-white/10 rounded mb-3" />
            <div className="h-6 w-24 bg-white/30 rounded" />
          </div>
          <div className="w-24 h-20 rounded-lg bg-white/10 flex items-center justify-center">
            <Image className="h-6 w-6 text-white/30" />
          </div>
        </div>
      );

    case "brands":
      return (
        <div className="bg-white p-4 min-h-[60px]">
          <div className="flex gap-6 items-center justify-center opacity-40">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-16 bg-zinc-200 rounded" />
            ))}
          </div>
        </div>
      );

    case "benefits":
      return (
        <div className="bg-gradient-to-b from-primary/5 to-white p-4 min-h-[80px]">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-2 border border-primary/10 text-center">
                <div className="h-5 w-5 bg-primary/20 rounded mx-auto mb-1" />
                <div className="h-2 w-12 bg-zinc-200 rounded mx-auto mb-0.5" />
                <div className="h-1.5 w-16 bg-zinc-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      );

    case "offer-products":
      return (
        <div className="bg-white p-4 min-h-[120px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-4 bg-primary rounded-full" />
            <div className="h-3 w-28 bg-zinc-200 rounded" />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-zinc-100 rounded-lg p-1.5">
                <div className="aspect-square bg-zinc-100 rounded mb-1" />
                <div className="h-1.5 w-full bg-zinc-200 rounded mb-0.5" />
                <div className="h-2 w-8 bg-primary/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case "category-products":
      return (
        <div className="bg-white p-4 min-h-[120px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-24 bg-zinc-200 rounded" />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-zinc-100 rounded-lg p-1.5">
                <div className="aspect-square bg-zinc-100 rounded mb-1" />
                <div className="h-1.5 w-full bg-zinc-200 rounded mb-0.5" />
                <div className="h-2 w-8 bg-zinc-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case "newsletter":
      return (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 min-h-[70px] flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 w-32 bg-white/30 rounded mb-1.5" />
            <div className="h-2 w-48 bg-white/15 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="h-7 w-32 bg-white/20 rounded" />
            <div className="h-7 w-16 bg-white/40 rounded" />
          </div>
        </div>
      );

    case "combos":
      return (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 min-h-[90px]">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
            <div className="h-3 w-32 bg-orange-200/50 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-orange-100 p-2 flex gap-2">
                <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 text-orange-300" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-16 bg-zinc-200 rounded mb-1" />
                  <div className="h-1.5 w-20 bg-zinc-100 rounded mb-1.5" />
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-8 bg-zinc-300 rounded line-through" />
                    <div className="h-2.5 w-10 bg-orange-400 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "categories-grid":
      return (
        <div className="bg-white p-4 min-h-[70px]">
          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="border border-zinc-100 rounded-lg p-2 text-center">
                <div className="h-6 w-6 bg-zinc-100 rounded-full mx-auto mb-1" />
                <div className="h-1.5 w-8 bg-zinc-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      );

    case "custom-html":
      return (
        <div className="bg-zinc-50 p-4 min-h-[60px] flex items-center justify-center border border-dashed border-zinc-200">
          <div className="flex items-center gap-2 text-zinc-400">
            <Code className="h-4 w-4" />
            <div className="text-[10px] font-mono">{"<html>"}</div>
          </div>
        </div>
      );

    default:
      return (
        <div className={`bg-gradient-to-r ${preview.bg} p-6 min-h-[80px] flex items-center gap-4`}>
          <div className="h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center">
            <Package className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <div className="h-3 w-24 bg-zinc-200 rounded mb-1" />
            <div className="h-2 w-32 bg-zinc-100 rounded" />
          </div>
        </div>
      );
  }
}

interface LayoutBuilderProps {
  config: StoreConfig;
  onChange: (config: StoreConfig) => void;
}

type SidebarTab = "components" | "settings";

export function LayoutBuilder({ config, onChange }: LayoutBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("components");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const categories = getCategories();

  const sections = config.sections || [];

  const updateSections = (newSections: StoreSection[]) => {
    onChange({ ...config, sections: newSections });
  };

  const addSection = (type: SectionType) => {
    const newSection: StoreSection = {
      id: generateSectionId(),
      type,
      active: true,
      title: type === "category-products" ? "Produtos" : type === "offer-products" ? "Ofertas" : undefined,
      maxProducts: type.includes("products") ? 6 : undefined,
      variant: type.includes("products") ? "default" : undefined,
      style: "default",
    };
    updateSections([...sections, newSection]);
    setSelectedId(newSection.id);
    setSidebarTab("settings");
  };

  const updateSection = (id: string, updates: Partial<StoreSection>) => {
    updateSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSection = (id: string) => {
    updateSections(sections.filter((s) => s.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSidebarTab("components");
    }
  };

  const toggleActive = (id: string) => {
    updateSections(sections.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...sections];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, moved);
    updateSections(arr);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...sections];
    [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
    updateSections(arr);
  };

  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return;
    const arr = [...sections];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    updateSections(arr);
  };

  const selectedSection = selectedId ? sections.find((s) => s.id === selectedId) : null;

  return (
    <div className="flex gap-0 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200" style={{ height: "calc(100vh - 280px)", minHeight: "600px" }}>
      {/* Left: Live Preview */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 p-4">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 min-h-full overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-200 bg-zinc-50">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white border border-zinc-200 rounded-md px-3 py-0.5 text-[10px] text-zinc-400 font-mono">
                pbrnfoods.com.br
              </div>
            </div>
            <div className="flex gap-1">
              <Monitor className="h-3 w-3 text-zinc-400" />
              <Smartphone className="h-3 w-3 text-zinc-300" />
            </div>
          </div>

          {/* Sections preview */}
          <div className="min-h-[500px]">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
                <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                  <LayoutGrid className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">Página vazia</p>
                <p className="text-xs text-zinc-400">Clique em um componente ao lado para adicionar</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {sections.map((section, idx) => {
                  const preview = sectionPreviews[section.type];
                  const Icon = sectionIcons[section.type] || Package;
                  const isSelected = selectedId === section.id;
                  const isDragging = dragIdx === idx;
                  const isDragOver = dragOverIdx === idx && dragIdx !== idx;

                  return (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => { setSelectedId(section.id); setSidebarTab("settings"); }}
                      className={`relative group cursor-pointer transition-all ${
                        isDragging ? "opacity-40 scale-[0.98]" : ""
                      } ${isDragOver ? "border-t-2 border-primary" : ""} ${
                        isSelected ? "ring-2 ring-inset ring-primary" : "hover:ring-2 hover:ring-inset hover:ring-zinc-300"
                      } ${!section.active ? "opacity-40" : ""}`}
                    >
                      {/* Section mini preview */}
                      <SectionMiniPreview section={section} />

                      {/* Label overlay */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm border border-zinc-200/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon className="h-3 w-3 text-zinc-500" />
                        <span className="text-[10px] font-semibold text-zinc-700">
                          {section.title || preview.label}
                        </span>
                      </div>

                      {/* Status badge */}
                      {!section.active && (
                        <div className="absolute top-2 right-2 bg-zinc-900/70 text-white text-[9px] font-bold rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          OCULTO
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-end p-2 opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-zinc-200 p-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActive(section.id); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                            title={section.active ? "Ocultar" : "Mostrar"}
                          >
                            {section.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveUp(idx); }}
                            disabled={idx === 0}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <span className="text-xs">↑</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveDown(idx); }}
                            disabled={idx === sections.length - 1}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <span className="text-xs">↓</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Drag handle */}
                      <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-zinc-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="w-[320px] bg-white border-l border-zinc-200 flex flex-col shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setSidebarTab("components")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              sidebarTab === "components"
                ? "text-zinc-900 border-b-2 border-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Componentes
          </button>
          <button
            onClick={() => setSidebarTab("settings")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              sidebarTab === "settings"
                ? "text-zinc-900 border-b-2 border-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
            disabled={!selectedSection}
          >
            Configurações
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {sidebarTab === "components" ? (
            <div className="p-4 space-y-5">
              {componentGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          onClick={() => addSection(item.type)}
                          className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
                        >
                          <div className="h-10 w-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center transition-colors">
                            <Icon className="h-5 w-5 text-zinc-500 group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              {selectedSection ? (
                <SectionSettings
                  section={selectedSection}
                  categories={categories}
                  onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                />
              ) : (
                <div className="text-center py-12">
                  <Settings className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Selecione uma seção para configurar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionSettings({
  section,
  categories,
  onUpdate,
}: {
  section: StoreSection;
  categories: ReturnType<typeof getCategories>;
  onUpdate: (updates: Partial<StoreSection>) => void;
}) {
  const Icon = sectionIcons[section.type] || Package;
  const preview = sectionPreviews[section.type];

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className={`rounded-xl bg-gradient-to-r ${preview.bg} p-4 flex items-center gap-3`}>
        <div className="h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center">
          <Icon className="h-5 w-5 text-zinc-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{section.title || preview.label}</p>
          <p className="text-xs text-zinc-500">{sectionTypeLabels[section.type]}</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
        <span className="text-sm text-zinc-700">Visível</span>
        <button
          onClick={() => onUpdate({ active: !section.active })}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            section.active ? "bg-primary" : "bg-zinc-300"
          }`}
        >
          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            section.active ? "left-[22px]" : "left-0.5"
          }`} />
        </button>
      </div>

      {/* Title */}
      {["offer-products", "category-products", "custom-html"].includes(section.type) && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Título da seção</label>
          <input
            value={section.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            placeholder="Ex: Ofertas da semana"
          />
        </div>
      )}

      {/* Subtitle */}
      {section.type === "offer-products" && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Subtítulo</label>
          <input
            value={section.subtitle || ""}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            placeholder="Ex: Aproveite nossos descontos"
          />
        </div>
      )}

      {/* Category */}
      {section.type === "category-products" && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Categoria</label>
          <select
            value={section.categorySlug || ""}
            onChange={(e) => onUpdate({ categorySlug: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">Selecione...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Max products */}
      {["offer-products", "category-products"].includes(section.type) && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Máximo de produtos</label>
          <div className="flex gap-2">
            {[3, 4, 6, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => onUpdate({ maxProducts: n })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (section.maxProducts || 6) === n
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style */}
      {["offer-products", "category-products"].includes(section.type) && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Estilo</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "default", label: "Padrão" },
              { value: "alt", label: "Alternativo" },
              { value: "featured", label: "Destaque" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ variant: opt.value as StoreSection["variant"] })}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  (section.variant || "default") === opt.value
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom HTML */}
      {section.type === "custom-html" && (
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Conteúdo HTML</label>
          <textarea
            value={section.html || ""}
            onChange={(e) => onUpdate({ html: e.target.value })}
            rows={6}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
            placeholder="<div>Seu conteúdo aqui</div>"
          />
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={() => onUpdate({ active: false })}
        className="w-full py-2 rounded-lg border border-zinc-200 text-sm text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
      >
        Remover seção
      </button>
    </div>
  );
}
