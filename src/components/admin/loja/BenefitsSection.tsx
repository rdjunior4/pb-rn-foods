import { useState } from "react";
import { generateId } from "@/lib/admin-store";
import { loadStoreConfig, saveStoreConfig, iconOptions } from "@/lib/store-config";
import type { StoreConfig, BenefitItem } from "@/lib/store-config";
import {
  Plus, Trash2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown,
  Star, ShieldCheck, Truck, Headset, BadgePercent, Clock, MapPin,
  CreditCard, Gift, Zap, Heart, RefreshCw, Package, CheckCircle,
  Award, ThumbsUp, Users, Phone, Mail, Globe, Lock, Key, Bell,
  Tag, Percent, DollarSign, Wallet, PiggyBank, Receipt, Calendar,
  Timer, Sparkles, Flame, Crown, Gem, Bookmark, Flag, Info,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp, BarChart,
  ShoppingCart, ShoppingBag, Store, Warehouse, Building, Factory,
  Wrench, Settings, Battery, Wifi, Cloud, Sun, Moon, Droplets,
  Wind, Snowflake, Umbrella, Leaf, TreePine, Fish, Bird, Dog,
  Cat, Pizza, Coffee, Wine, Beef, Egg, Milk, Search, X,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck, Truck, Headset, BadgePercent, Star, Clock, MapPin,
  CreditCard, Gift, Zap, Heart, RefreshCw, Package, CheckCircle,
  Award, ThumbsUp, Users, Phone, Mail, Globe, Lock, Key, Bell,
  Tag, Percent, DollarSign, Wallet, PiggyBank, Receipt, Calendar,
  Timer, Sparkles, Flame, Crown, Gem, Bookmark, Flag, Info,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp, BarChart,
  ShoppingCart, ShoppingBag, Store, Warehouse, Building, Factory,
  Wrench, Settings, Battery, Wifi, Cloud, Sun, Moon, Droplets,
  Wind, Snowflake, Umbrella, Leaf, TreePine, Fish, Bird, Dog,
  Cat, Pizza, Coffee, Wine, Beef, Egg, Milk, Eye,
};

const iconGroups = [
  {
    label: "Frete & Entrega",
    icons: ["Truck", "Package", "Clock", "Timer", "RefreshCw", "MapPin", "Globe", "Warehouse"],
  },
  {
    label: "Pagamento",
    icons: ["CreditCard", "Wallet", "PiggyBank", "Receipt", "DollarSign", "Percent", "Tag", "BadgePercent"],
  },
  {
    label: "Confiança",
    icons: ["ShieldCheck", "Lock", "Key", "CheckCircle", "CheckCircle2", "Award", "Star", "Bookmark"],
  },
  {
    label: "Atendimento",
    icons: ["Headset", "Phone", "Mail", "Users", "Heart", "ThumbsUp", "Bell", "Info"],
  },
  {
    label: "Promoções",
    icons: ["Gift", "Sparkles", "Flame", "Crown", "Gem", "Zap", "TrendingUp", "Flag"],
  },
  {
    label: "Loja",
    icons: ["ShoppingCart", "ShoppingBag", "Store", "Building", "Factory", "Eye", "Settings", "Wrench"],
  },
  {
    label: "Clima",
    icons: ["Sun", "Moon", "Cloud", "Droplets", "Wind", "Snowflake", "Umbrella", "Leaf"],
  },
  {
    label: "Alimentos",
    icons: ["Pizza", "Coffee", "Wine", "Beef", "Egg", "Milk", "Fish", "Bird"],
  },
];

const iconOptionsAll = Object.keys(iconMap);

export function BenefitsSection() {
  const [config, setConfig] = useState<StoreConfig>(() => loadStoreConfig());
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todos");

  const handleAdd = () => {
    const newId = generateId();
    const next = {
      ...config,
      benefits: [
        ...config.benefits,
        { id: newId, icon: "Star", title: "", desc: "", active: true },
      ],
    };
    saveStoreConfig(next);
    setConfig(next);
    setOpenPicker(newId);
  };

  const handleRemove = (id: string) => {
    const next = {
      ...config,
      benefits: config.benefits.filter((b) => b.id !== id),
    };
    saveStoreConfig(next);
    setConfig(next);
  };

  const handleUpdate = (id: string, field: keyof BenefitItem, value: string | boolean) => {
    const next = {
      ...config,
      benefits: config.benefits.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    };
    saveStoreConfig(next);
    setConfig(next);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...config.benefits];
    [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
    const next = { ...config, benefits: arr };
    saveStoreConfig(next);
    setConfig(next);
  };

  const moveDown = (idx: number) => {
    if (idx === config.benefits.length - 1) return;
    const arr = [...config.benefits];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    const next = { ...config, benefits: arr };
    saveStoreConfig(next);
    setConfig(next);
  };

  const filteredIcons = iconSearch
    ? iconOptionsAll.filter((opt) => opt.toLowerCase().includes(iconSearch.toLowerCase()))
    : selectedGroup === "Todos"
      ? iconOptionsAll
      : iconGroups.find((g) => g.label === selectedGroup)?.icons || iconOptionsAll;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{config.benefits.length} benefício(s)</p>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar benefício
        </button>
      </div>

      <div className="space-y-3">
        {config.benefits.map((b, idx) => {
          const IconComp = iconMap[b.icon] || Star;
          const isPickerOpen = openPicker === b.id;

          return (
            <div
              key={b.id}
              className={`bg-white rounded-lg border border-zinc-200 p-4 hover:shadow-md transition-all ${!b.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Move controls */}
                <div className="flex flex-col items-center gap-0.5 pt-2">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="h-6 w-6 flex items-center justify-center text-zinc-300 hover:text-zinc-500 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <GripVertical className="h-4 w-4 text-zinc-300" />
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === config.benefits.length - 1}
                    className="h-6 w-6 flex items-center justify-center text-zinc-300 hover:text-zinc-500 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Top row: Icon picker + Title + Description */}
                  <div className="flex items-start gap-3">
                    {/* Icon button */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenPicker(isPickerOpen ? null : b.id)}
                        className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 transition-colors"
                      >
                        <IconComp className="h-5 w-5 text-primary" />
                      </button>

                      {/* Icon Picker Dropdown */}
                      {isPickerOpen && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg border border-zinc-200 shadow-xl z-50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-zinc-700">Selecionar ícone</p>
                            <button
                              onClick={() => setOpenPicker(null)}
                              className="h-5 w-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                            <input
                              value={iconSearch}
                              onChange={(e) => setIconSearch(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                              placeholder="Buscar..."
                              autoFocus
                            />
                          </div>

                          {/* Groups */}
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedGroup("Todos")}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                selectedGroup === "Todos"
                                  ? "bg-zinc-900 text-white"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              }`}
                            >
                              Todos
                            </button>
                            {iconGroups.map((g) => (
                              <button
                                key={g.label}
                                type="button"
                                onClick={() => setSelectedGroup(g.label)}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                  selectedGroup === g.label
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>

                          {/* Icon Grid */}
                          <div className="grid grid-cols-8 gap-1 max-h-[180px] overflow-y-auto">
                            {filteredIcons.map((opt) => {
                              const Ic = iconMap[opt];
                              if (!Ic) return null;
                              const isSelected = b.icon === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    handleUpdate(b.id, "icon", opt);
                                    setOpenPicker(null);
                                    setIconSearch("");
                                    setSelectedGroup("Todos");
                                  }}
                                  className={`h-8 w-full flex items-center justify-center rounded-lg border transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary text-white"
                                      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 bg-zinc-50"
                                  }`}
                                  title={opt}
                                >
                                  <Ic className="h-3.5 w-3.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title + Description */}
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Título</label>
                        <input
                          value={b.title}
                          onChange={(e) => handleUpdate(b.id, "title", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          placeholder="Ex: Entrega rápida"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição</label>
                        <input
                          value={b.desc}
                          onChange={(e) => handleUpdate(b.id, "desc", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          placeholder="Ex: Entregas em até 24h"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleUpdate(b.id, "active", !b.active)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title={b.active ? "Desativar" : "Ativar"}
                  >
                    {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {config.benefits.length === 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <Sparkles className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-900">Nenhum benefício cadastrado</p>
          <p className="text-xs text-zinc-400 mt-1">Adicione benefícios para destacar os pontos fortes da sua loja</p>
        </div>
      )}
    </div>
  );
}
