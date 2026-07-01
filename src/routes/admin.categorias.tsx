import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminCategories, useAdminProducts, useSaveCategory, useDeleteCategory } from "@/lib/hooks";
import { generateId, slugify, loadStore, saveStore } from "@/lib/admin-store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { apiReorderCategories } from "@/lib/api/admin-writes";
import { queryKeys } from "@/lib/query-keys";
import {
  Tags, Plus, Pencil, Trash2, AlertTriangle, X, Search, GripVertical,
  ChevronUp, ChevronDown, Package, ShoppingCart, Beef, Wine, Milk, Egg, Soup, Droplets,
  Shirt, Home, Pizza, Coffee, Baby, Dog, Flower2, Heart, Sparkles, Gem, Watch, Gift,
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
  Croissant, CakeSlice, Cookie, Utensils, UtensilsCrossed, Cherry, Apple,
  Salad, Sandwich, IceCreamBowl, CookingPot, Drumstick, Popcorn, Wheat,
  Citrus, EggFried, Beer, GlassWater, CupSoda,
  IceCream2, Cake, Ham, Bean, Leaf, Carrot, FishOff, Bone, HeartPulse,
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
  Croissant, CakeSlice, Cookie, Utensils, UtensilsCrossed, Cherry, Apple,
  Salad, Sandwich, IceCreamBowl, CookingPot, Drumstick, Popcorn, Wheat,
  Citrus, EggFried, Beer, GlassWater, CupSoda, IceCream2, Cake,
  Ham, Bean, Leaf, Carrot, Bone, HeartPulse,
};

const iconGroups = [
  { label: "Todos", icons: Object.keys(iconMap) },
  { label: "Alimentos", icons: ["Package", "Beef", "Egg", "EggFried", "Milk", "Pizza", "Soup", "Coffee", "Croissant", "CakeSlice", "Cake", "Cookie", "Utensils", "UtensilsCrossed", "Cherry", "Apple", "Grape", "Nut", "Salad", "Sandwich", "IceCreamBowl", "IceCream2", "CookingPot", "Drumstick", "Popcorn", "Wheat", "Citrus", "Ham", "Bean", "Leaf", "Carrot", "Bone", "Fish", "Bird"] },
  { label: "Bebidas", icons: ["Wine", "WineOff", "Beer", "Droplets", "Coffee", "Milk", "GlassWater", "CupSoda"] },
  { label: "Casa", icons: ["Home", "Flower2", "Lightbulb"] },
  { label: "Moda", icons: ["Shirt", "Gem", "Watch", "Heart", "Briefcase"] },
  { label: "Beleza", icons: ["Sparkles", "Heart", "Shield", "Baby", "HeartPulse"] },
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
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const saveMutation = useSaveCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");
  const [iconSearch, setIconSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todos");

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

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
        sortOrder: categories.length,
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

  // ─── Reorder logic ───
  const persistOrder = useCallback(async (reordered: Category[]) => {
    // Update in-memory cache
    const store = loadStore();
    store.categories = reordered;
    saveStore(store);

    // Update React Query cache immediately (no refetch needed)
    qc.setQueryData(queryKeys.admin.categories(), reordered);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        await apiReorderCategories(reordered.map((c, i) => ({ id: c.id, sortOrder: i })));
      } catch (err) {
        console.error("[categorias] reorder sync failed:", err);
      }
    }
  }, [qc]);

  const moveCategory = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    persistOrder(reordered);
  }, [categories, persistOrder]);

  // ─── Drag handlers ───
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    requestAnimationFrame(() => {
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDraggedId(null);
    setDragOverId(null);
    dragCounterRef.current = 0;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = categories.findIndex((c) => c.id === draggedId);
    const toIndex = categories.findIndex((c) => c.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) moveCategory(fromIndex, toIndex);
  }, [draggedId, categories, moveCategory]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Categorias</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
            <span className="text-zinc-400 ml-1">· arraste para reordenar</span>
          </p>
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

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>
            <button
              onClick={resetForm}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            {/* Left: Name + Preview */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  placeholder="Ex: Bebidas"
                  autoFocus
                />
                {name.trim() && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Slug: <span className="text-zinc-600 font-mono">{slugify(name)}</span>
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50">
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2">Prévia</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{name || "Nome"}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">{name ? slugify(name) : "slug"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Icon Picker */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Ícone</label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  placeholder="Buscar..."
                />
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {iconGroups.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => { setSelectedGroup(g.label); setIconSearch(""); }}
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
              <div className="grid grid-cols-8 gap-1 max-h-[180px] overflow-y-auto rounded-lg border border-zinc-200 p-1.5 bg-zinc-50">
                {filteredIconOptions.map((opt) => {
                  const Ic = iconMap[opt];
                  if (!Ic) return null;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      className={`h-8 w-full flex items-center justify-center rounded border-2 transition-all ${
                        icon === opt
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-transparent text-zinc-500 hover:border-zinc-300 bg-white"
                      }`}
                      title={opt}
                    >
                      <Ic className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm"
            >
              {editingId ? "Salvar" : "Criar"}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-zinc-100"
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

      {/* Category List */}
      {filteredCategories.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="h-14 w-14 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
            <Tags className="h-7 w-7 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">
            {searchQuery ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery ? "Tente outro termo" : "Clique em 'Nova categoria' para começar"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[36px_32px_40px_1fr_1fr_100px_90px] items-center gap-3 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
            <span></span>
            <span className="text-center">#</span>
            <span className="text-center">Ícone</span>
            <span>Nome</span>
            <span>Slug</span>
            <span className="text-center">Produtos</span>
            <span className="text-center">Ações</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-zinc-100">
            {filteredCategories.map((c, index) => {
              const CatIcon = iconMap[c.icon] || Tags;
              const count = productCounts[c.id] || 0;
              const isDraggedOver = dragOverId === c.id;
              const isDragging = draggedId === c.id;
              const realIndex = categories.findIndex((cat) => cat.id === c.id);

              return (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c.id)}
                  onDragEnd={handleDragEnd}
                  onDragEnter={(e) => handleDragEnter(e, c.id)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, c.id)}
                  className={`group grid grid-cols-[36px_32px_40px_1fr_1fr_100px_90px] items-center gap-3 px-4 py-3 transition-all duration-150 ${
                    isDragging
                      ? "opacity-40 bg-zinc-50"
                      : isDraggedOver
                        ? "bg-blue-50 border-t-2 border-t-blue-500"
                        : "hover:bg-zinc-50"
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 flex items-center justify-center shrink-0 transition-colors">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Position number */}
                  <span className="text-[11px] font-mono text-zinc-400 text-center shrink-0 tabular-nums">
                    {realIndex + 1}
                  </span>

                  {/* Icon */}
                  <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mx-auto">
                    <CatIcon className="h-4 w-4 text-zinc-600" />
                  </div>

                  {/* Nome */}
                  <span className="text-sm font-semibold text-zinc-900 truncate">{c.name}</span>

                  {/* Slug */}
                  <span className="text-xs text-zinc-400 font-mono truncate">{c.slug}</span>

                  {/* Produtos */}
                  <span className={`text-xs font-medium text-center ${count > 0 ? "text-zinc-700 bg-zinc-100 rounded-full px-2 py-0.5" : "text-zinc-400"}`}>
                    {count}
                  </span>

                  {/* Ações */}
                  <div className="flex items-center justify-center gap-0.5 shrink-0">
                    <div className="flex flex-col -space-y-0.5 mr-0.5">
                      <button
                        onClick={() => moveCategory(realIndex, realIndex - 1)}
                        disabled={realIndex === 0}
                        className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveCategory(realIndex, realIndex + 1)}
                        disabled={realIndex === categories.length - 1}
                        className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleEdit(c)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                      {deleteProductCount} produto(s) ficarão sem categoria.
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
