import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAdminCategories, useAdminProducts, useSaveCategory, useDeleteCategory } from "@/lib/hooks";
import { generateId, slugify } from "@/lib/admin-store";
import {
  Tags, Plus, Pencil, Trash2, AlertTriangle, X, Search, LayoutGrid, List,
  Package, ShoppingCart, Beef, Wine, Milk, Egg, Soup, Droplets, Shirt, Home,
  Pizza, Coffee, Baby, Dog, Flower2, Heart, Sparkles, Gem, Watch, Gift,
  Star, Zap, Shield, Clock, MapPin, Phone, Mail, Globe, Camera, Music,
  BookOpen, GraduationCap, Dumbbell, Wrench, Hammer, Scissors, Lightbulb,
  Wifi, Monitor, Smartphone, Headphones, Printer, Database, Server, Cloud,
  Lock, Key, CreditCard, Wallet, PiggyBank, Banknote, Receipt, Calculator,
  Calendar, Bell, Flag, Tag, Percent, DollarSign, Landmark, Building,
  Factory, Truck, Users, Settings, HelpCircle, ShoppingBag, Store, Warehouse,
  ClipboardList, BarChart3, User, Briefcase, Film, Video, Mic, Radio, Tv,
  Play, Pause, Volume2, Disc3, Folder, FileText, Clipboard, Award, Trophy,
  Tent, TreePine, Mountain, Waves, Anchor, Compass, Map, Navigation, Fish,
  Umbrella, Snowflake, Sun, Moon, Sunrise, CloudRain, Bird, Loader2,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, ShoppingCart, ShoppingBag, Beef, Wine, Milk, Egg, Soup, Droplets,
  Shirt, Home, Pizza, Coffee, Baby, Dog, Bird, Fish, Flower2, Heart, Sparkles,
  Gem, Watch, Gift, Star, Zap, Shield, Clock, MapPin, Phone, Mail, Globe,
  Camera, Music, BookOpen, GraduationCap, Dumbbell, Wrench, Hammer, Scissors,
  Lightbulb, Wifi, Monitor, Smartphone, Headphones, Printer, Database, Server,
  Cloud, Lock, Key, CreditCard, Wallet, PiggyBank, Banknote, Receipt,
  Calculator, Calendar, Bell, Flag, Tag, Percent, DollarSign, Landmark,
  Building, Factory, Truck, Users, Settings, HelpCircle, Store, Warehouse,
  ClipboardList, BarChart3, User, Briefcase, Film, Video, Mic, Radio, Tv,
  Play, Pause, Volume2, Disc3, Folder, FileText, Clipboard, Award, Trophy,
  Tent, TreePine, Mountain, Waves, Anchor, Compass, Map, Navigation, Umbrella,
  Snowflake, Sun, Moon, Sunrise, CloudRain,
};

const iconGroups = [
  { label: "Todos", icons: Object.keys(iconMap) },
  { label: "Alimentos", icons: ["Package", "Beef", "Egg", "Milk", "Pizza", "Soup", "Coffee"] },
  { label: "Bebidas", icons: ["Wine", "Droplets", "Coffee", "Milk"] },
  { label: "Casa", icons: ["Home", "Flower2", "Lightbulb"] },
  { label: "Moda", icons: ["Shirt", "Gem", "Watch", "Heart", "Crown", "Briefcase"] },
  { label: "Beleza", icons: ["Sparkles", "Heart", "Shield", "Baby"] },
  { label: "Tecnologia", icons: ["Monitor", "Smartphone", "Headphones", "Printer", "Wifi", "Database"] },
  { label: "Esportes", icons: ["Dumbbell", "Tent", "Mountain", "Map", "Compass", "Anchor"] },
  { label: "Ferramentas", icons: ["Wrench", "Hammer", "Scissors", "Settings"] },
  { label: "Serviços", icons: ["Truck", "Warehouse", "Store", "Building", "Factory"] },
  { label: "Finanças", icons: ["CreditCard", "Wallet", "PiggyBank", "Banknote", "Receipt", "Calculator"] },
  { label: "Educação", icons: ["BookOpen", "GraduationCap", "Award", "Trophy"] },
  { label: "Mídia", icons: ["Camera", "Music", "Film", "Video", "Mic", "Tv", "Radio", "Play"] },
  { label: "Pet", icons: ["Dog", "Fish", "Bird"] },
  { label: "Escritório", icons: ["Clipboard", "FileText", "Folder", "Calendar", "Bell", "Tag"] },
  { label: "Clima", icons: ["Sun", "Moon", "Snowflake", "CloudRain", "TreePine", "Waves", "Umbrella"] },
];

const iconOptions = Object.keys(iconMap);

function AdminCategories() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const saveMutation = useSaveCategory();
  const deleteMutation = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todos");

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const resetForm = () => {
    setName("");
    setIcon("Package");
    setEditingId(null);
    setShowForm(false);
    setIconSearch("");
    setSelectedGroup("Todos");
  };

  const handleEdit = (c: Category) => {
    setName(c.name);
    setIcon(c.icon);
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    const slug = slugify(name);

    if (editingId) {
      const existing = categories.find((c) => c.slug === slug && c.id !== editingId);
      if (existing) {
        toast.error("Já existe uma categoria com esse nome");
        return;
      }
      const cat = categories.find((c) => c.id === editingId);
      if (cat) {
        saveMutation.mutate({ ...cat, name: name.trim(), slug, icon }, {
          onSuccess: () => {
            resetForm();
            toast.success("Categoria atualizada");
          },
        });
      }
    } else {
      const existing = categories.find((c) => c.slug === slug);
      if (existing) {
        toast.error("Já existe uma categoria com esse nome");
        return;
      }
      saveMutation.mutate({
        id: generateId(),
        name: name.trim(),
        slug,
        icon,
        productCount: 0,
      }, {
        onSuccess: () => {
          resetForm();
          toast.success("Categoria criada");
        },
      });
    }
  };

  const deleteCategory = categories.find((c) => c.id === deleteId);
  const deleteProductCount = deleteId ? productCounts[deleteId] || 0 : 0;

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast.success(
          deleteProductCount > 0
            ? `Categoria removida. ${deleteProductCount} produto(s) ficarão sem categoria.`
            : "Categoria removida",
        );
      },
    });
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeGroup = iconGroups.find((g) => g.label === selectedGroup);
  const filteredIconOptions = iconSearch
    ? iconOptions.filter((opt) => opt.toLowerCase().includes(iconSearch.toLowerCase()))
    : activeGroup?.icons || iconOptions;

  const IconComponent = iconMap[icon] || Package;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Categorias</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {categories.length} {categories.length === 1 ? "categoria" : "categorias"} cadastrada{categories.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-9 w-9 flex items-center justify-center transition-colors ${
                viewMode === "grid" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 flex items-center justify-center transition-colors ${
                viewMode === "list" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova categoria
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>
            <button
              onClick={resetForm}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {/* Left: Name + Preview */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  placeholder="Ex: Bebidas"
                />
                {name.trim() && (
                  <p className="text-xs text-zinc-400 mt-1.5">
                    Slug: <span className="text-zinc-600 font-mono">{slugify(name)}</span>
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50">
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-3">Prévia</p>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                    <IconComponent className="h-7 w-7 text-zinc-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{name || "Nome da categoria"}</p>
                    <p className="text-xs text-zinc-400 font-mono">{name ? slugify(name) : "slug"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ícone</label>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  placeholder="Buscar ícone..."
                />
              </div>

              {/* Groups */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {iconGroups.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => { setSelectedGroup(g.label); setIconSearch(""); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
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
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[240px] overflow-y-auto rounded-lg border border-zinc-200 p-2 bg-zinc-50">
                {filteredIconOptions.map((opt) => {
                  const Ic = iconMap[opt];
                  if (!Ic) return null;
                  const isSelected = icon === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      className={`h-10 w-full flex items-center justify-center rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 bg-white"
                      }`}
                      title={opt}
                    >
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors shadow-sm"
            >
              {editingId ? "Salvar alterações" : "Criar categoria"}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {categories.length > 0 && !showForm && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            placeholder="Buscar categorias..."
          />
        </div>
      )}

      {/* Categories */}
      {filteredCategories.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Tags className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">
            {searchQuery ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery ? "Tente outro termo de busca" : "Crie categorias para organizar seus produtos"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((c) => {
            const CatIcon = iconMap[c.icon] || Tags;
            const count = productCounts[c.id] || 0;
            return (
              <div
                key={c.id}
                className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-lg hover:border-zinc-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                    <CatIcon className="h-7 w-7 text-zinc-600" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(c)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-zinc-400 font-mono">{c.slug}</span>
                    <span className="text-zinc-300">·</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${count > 0 ? "text-zinc-700" : "text-zinc-400"}`}>
                      <Package className="h-3 w-3" />
                      {count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {filteredCategories.map((c) => {
            const CatIcon = iconMap[c.icon] || Tags;
            const count = productCounts[c.id] || 0;
            return (
              <div
                key={c.id}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                  <CatIcon className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-900 truncate">{c.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400 font-mono">{c.slug}</span>
                    <span className="text-zinc-300">·</span>
                    <span className={`text-xs font-semibold ${count > 0 ? "text-zinc-700" : "text-zinc-400"}`}>
                      {count} {count === 1 ? "produto" : "produtos"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(c)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir categoria
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategory && (
                <>
                  Tem certeza que deseja excluir <strong>{deleteCategory.name}</strong>?
                  {deleteProductCount > 0 && (
                    <span className="block mt-1 text-amber-600 font-medium">
                      {deleteProductCount} produto(s) associado(s) ficarão sem categoria.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
