import { useForm, useFieldArray } from "react-hook-form";
import { Link } from "@tanstack/react-router";
import {
  Save, Plus, X, Tag, Info, List, ImageIcon,
  Package, Truck, ShieldCheck, Heart, Eye, ImagePlus,
  Percent, ShoppingCart, Check, Pencil, AlertTriangle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useAdminCategories, useAdminBrands } from "@/lib/hooks";
import { unitLabels, SELECT_CLASSES } from "@/lib/constants";
import { readFileAsDataURL } from "@/lib/utils";

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  categoryIds: string[];
  brand: string;
  price: string;
  oldPrice: string;
  unit: "un" | "kg" | "fd" | "pc";
  image: string;
  images: string[];
  stock: string;
  featured: boolean;
  details: { value: string }[];
  specs: { label: string; value: string }[];
  pricingTiers: {
    packageType: string;
    label: string;
    quantityPerPackage: string;
    packagePrice: string;
    minPackages: string;
  }[];
}

interface ProductFormProps {
  defaultValues: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel: string;
  existingImage?: string;
  existingImages?: string[];
  onDuplicate?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

const selectClass = SELECT_CLASSES.admin;

export function ProductForm({
  defaultValues,
  onSubmit,
  submitLabel,
  existingImage,
  existingImages = [],
  onDuplicate,
}: ProductFormProps) {
  const [allImages, setAllImages] = useState<string[]>(
    existingImages.length > 0
      ? existingImages
      : existingImage
        ? [existingImage]
        : []
  );
  const [savedTiers, setSavedTiers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const { data: categories = [] } = useAdminCategories();
  const { data: brands = [] } = useAdminBrands();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      ...defaultValues,
      images: existingImages.length > 0 ? existingImages : defaultValues.images || [],
    },
  });

  const {
    fields: detailFields,
    append: appendDetail,
    remove: removeDetail,
  } = useFieldArray({ control, name: "details" });
  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control, name: "specs" });
  const {
    fields: tierFields,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({ control, name: "pricingTiers" });

  const watchedName = watch("name");
  const watchedBrand = watch("brand");
  const watchedPrice = watch("price");
  const watchedOldPrice = watch("oldPrice");
  const watchedStock = watch("stock");
  const watchedUnit = watch("unit");
  const watchedDescription = watch("description");
  const watchedDetails = watch("details");
  const watchedSpecs = watch("specs");
  const watchedCategoryId = watch("categoryId");
  const watchedCategoryIds = watch("categoryIds");
  const watchedPricingTiers = watch("pricingTiers");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: string[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Imagem "${file.name}" excede 5MB e foi ignorada`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        newImages.push(dataUrl);
      } catch {
        alert(`Erro ao ler "${file.name}"`);
      }
    }

    if (newImages.length > 0) {
      const updated = [...allImages, ...newImages];
      setAllImages(updated);
      setValue("image", updated[0] || "");
      setValue("images", updated);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const updated = allImages.filter((_, i) => i !== index);
    setAllImages(updated);
    setValue("image", updated[0] || "");
    setValue("images", updated);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= allImages.length) return;
    const updated = [...allImages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setAllImages(updated);
    setValue("image", updated[0] || "");
    setValue("images", updated);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    handleMoveImage(dragIdx, idx);
    setDragIdx(null);
  };
  const handleDragEnd = () => setDragIdx(null);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "R$ 0,00";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const discountPercent =
    watchedOldPrice && watchedPrice
      ? Math.round(
          ((parseFloat(watchedOldPrice) - parseFloat(watchedPrice)) /
            parseFloat(watchedOldPrice)) *
            100
        )
      : 0;

  const stockLevel =
    parseInt(watchedStock || "0") > 20
      ? "high"
      : parseInt(watchedStock || "0") > 5
        ? "low"
        : "critical";
  const stockLabel =
    stockLevel === "high"
      ? "Em estoque"
      : stockLevel === "low"
        ? `Apenas ${watchedStock} unidades`
        : "Últimas unidades";
  const stockColor =
    stockLevel === "high"
      ? "text-emerald-600"
      : stockLevel === "low"
        ? "text-amber-600"
        : "text-red-600";
  const stockDot =
    stockLevel === "high"
      ? "bg-emerald-500"
      : stockLevel === "low"
        ? "bg-amber-500"
        : "bg-red-500";

  const categoryName =
    categories.find((c) => c.id === watchedCategoryId)?.name || "";

  const validDetails = (watchedDetails || []).filter((d: { value: string }) => d?.value?.trim()).map((d) => d.value);
  const validSpecs = (watchedSpecs || []).filter(
    (s: { label: string; value: string }) => s?.label?.trim() || s?.value?.trim()
  );


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ===== BASIC INFO ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-700">Informações básicas</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nome do produto <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name", { required: "O nome é obrigatório" })}
              placeholder="Ex: Arroz Tio João Parboilizado 5kg"
              className={inputClass}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Descrição
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Descreva as características do produto..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Categorias <span className="text-zinc-400 font-normal">(selecione uma ou mais)</span>
            </label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3 max-h-40 overflow-y-auto">
              {categories.length === 0 && (
                <span className="text-xs text-zinc-400">Nenhuma categoria cadastrada</span>
              )}
              {categories.map((c) => {
                const checked = watchedCategoryIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? watchedCategoryIds.filter((id) => id !== c.id)
                          : [...watchedCategoryIds, c.id];
                        setValue("categoryIds", next);
                        if (next.length === 1) setValue("categoryId", next[0]);
                        else if (next.length > 0) setValue("categoryId", next[0]);
                        else setValue("categoryId", "");
                      }}
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
            {watchedCategoryIds.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Selecione ao menos uma categoria</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Marca
            </label>
            <select
              {...register("brand")}
              className={selectClass}
            >
              <option value="">Selecione a marca</option>
              {brands
                .filter((b) => b.active)
                .map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== PRICING ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-700">Preços e estoque</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Preço (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register("price", { required: "O preço é obrigatório" })}
              className={inputClass}
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Preço original (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Opcional"
              {...register("oldPrice")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Estoque
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              {...register("stock")}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Unidade
            </label>
            <select {...register("unit")} className={selectClass}>
              {Object.entries(unitLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                {...register("featured")}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-zinc-700">Produto em destaque</span>
            </label>
          </div>
        </div>

        {/* Volume / Wholesale Pricing */}
        <div className="border-t border-zinc-100 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-zinc-400" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-700">Preços por volume (atacado)</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Defina preços progressivos para compras maiores
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => appendTier({ packageType: "un", label: "", quantityPerPackage: "", packagePrice: "", minPackages: "1" })}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar embalagem
            </button>
          </div>

          {tierFields.length > 0 && (
            <div className="space-y-3">
              {tierFields.map((field, idx) => {
                const qtyPerPkg = parseInt(watch(`pricingTiers.${idx}.quantityPerPackage`) || "0");
                const pkgPrice = parseFloat(watch(`pricingTiers.${idx}.packagePrice`) || "0");
                const basePrice = parseFloat(watchedPrice || "0");
                const unitPrice = qtyPerPkg > 0 && pkgPrice > 0 ? pkgPrice / qtyPerPkg : 0;
                const tierDiscount =
                  unitPrice > 0 && basePrice > 0
                    ? Math.round(((basePrice - unitPrice) / basePrice) * 100)
                    : 0;

                const pkgType = watch(`pricingTiers.${idx}.packageType`);
                const pkgLabel =
                  pkgType === "cx" ? "Caixa" :
                  pkgType === "fd" ? "Fardo" :
                  pkgType === "pc" ? "Pacote" :
                  pkgType === "dz" ? "Dúzia" :
                  pkgType === "pt" ? "Peça" : "Unidade";

                const isTierSaved = savedTiers.has(field.id);

                return (
                  <div
                    key={field.id}
                    className={`rounded-lg border p-4 space-y-3 transition-all ${
                      isTierSaved
                        ? "border-primary/40 bg-primary"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${
                          isTierSaved ? "bg-white text-primary" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {isTierSaved ? <Check className="h-4 w-4" /> : idx + 1}
                        </span>
                        <span className={`text-sm font-bold ${
                          isTierSaved ? "text-white" : "text-zinc-700"
                        }`}>
                          {pkgLabel || "Nova embalagem"}
                        </span>
                        {tierDiscount > 0 && (
                          <span className={`inline-flex items-center rounded-full text-xs font-bold px-2.5 py-0.5 ${
                            isTierSaved
                              ? "bg-white text-primary shadow-sm"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            -{tierDiscount}% off
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isTierSaved ? (
                          <button
                            type="button"
                            onClick={() => {
                              const qty = parseInt(watch(`pricingTiers.${idx}.quantityPerPackage`) || "0");
                              const price = parseFloat(watch(`pricingTiers.${idx}.packagePrice`) || "0");
                              if (qty > 0 && price > 0) {
                                setSavedTiers((prev) => new Set([...prev, field.id]));
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs bg-primary text-white hover:bg-primary-hover font-medium rounded-lg px-3 py-1.5 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirmar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSavedTiers((prev) => {
                                const next = new Set(prev);
                                next.delete(field.id);
                                return next;
                              });
                            }}
                            className="inline-flex items-center gap-1.5 text-xs bg-white text-primary hover:bg-white/90 font-bold rounded-lg px-3 py-1.5 transition-colors shadow-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors ${
                            isTierSaved
                              ? "text-white hover:text-white/80"
                              : "text-red-400 hover:text-red-600"
                          }`}
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Package type */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${
                          isTierSaved ? "text-white" : "text-zinc-500"
                        }`}>
                          Tipo de embalagem
                        </label>
                        <select
                          {...register(`pricingTiers.${idx}.packageType`)}
                          disabled={isTierSaved}
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-colors disabled:text-white ${
                            isTierSaved
                              ? "border-white/20 bg-white/20 text-white"
                              : "border-zinc-200 bg-white focus:border-primary"
                          }`}
                        >
                          <option value="un">Unidade</option>
                          <option value="cx">Caixa</option>
                          <option value="fd">Fardo</option>
                          <option value="pc">Pacote</option>
                          <option value="dz">Dúzia</option>
                          <option value="pt">Peça</option>
                        </select>
                      </div>

                      {/* Label */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${
                          isTierSaved ? "text-white" : "text-zinc-500"
                        }`}>
                          Nome da embalagem
                        </label>
                        <input
                          {...register(`pricingTiers.${idx}.label`)}
                          disabled={isTierSaved}
                          placeholder="Ex: Caixa com 12"
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-white/50 disabled:text-white ${
                            isTierSaved
                              ? "border-white/20 bg-white/20 text-white"
                              : "border-zinc-200 bg-white focus:border-primary"
                          }`}
                        />
                      </div>

                      {/* Quantity per package */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${
                          isTierSaved ? "text-white" : "text-zinc-500"
                        }`}>
                          Qtd. por embalagem
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register(`pricingTiers.${idx}.quantityPerPackage`)}
                          disabled={isTierSaved}
                          placeholder="12"
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-white/50 disabled:text-white ${
                            isTierSaved
                              ? "border-white/20 bg-white/20 text-white"
                              : "border-zinc-200 bg-white focus:border-primary"
                          }`}
                        />
                      </div>

                      {/* Package price */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${
                          isTierSaved ? "text-white" : "text-zinc-500"
                        }`}>
                          Preço da embalagem (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`pricingTiers.${idx}.packagePrice`)}
                          disabled={isTierSaved}
                          placeholder="0,00"
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-white/50 disabled:text-white ${
                            isTierSaved
                              ? "border-white/20 bg-white/20 text-white"
                              : "border-zinc-200 bg-white focus:border-primary"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-2 border-t font-medium ${
                      isTierSaved ? "border-white/20" : "border-zinc-100"
                    }`}>
                      <span className={isTierSaved ? "text-white" : "text-zinc-500"}>
                        Preço por unidade:{" "}
                        <strong className={isTierSaved ? "text-white" : "text-zinc-700"}>
                          {unitPrice > 0
                            ? unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </strong>
                      </span>
                      <span className={isTierSaved ? "text-white" : "text-zinc-500"}>
                        Qtd. mínima:{" "}
                        <strong className={isTierSaved ? "text-white" : "text-zinc-700"}>
                          {watch(`pricingTiers.${idx}.minPackages`) || "1"} {pkgLabel.toLowerCase()}(s)
                        </strong>
                      </span>
                      <span className={isTierSaved ? "text-white" : "text-zinc-500"}>
                        Total mínimo:{" "}
                        <strong className={isTierSaved ? "text-white" : "text-zinc-700"}>
                          {pkgPrice > 0
                            ? (pkgPrice * parseInt(watch(`pricingTiers.${idx}.minPackages`) || "1")).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </strong>
                      </span>
                    </div>

                    {/* Min packages */}
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-medium ${isTierSaved ? "text-white" : "text-zinc-500"}`}>
                        Comprar a partir de:
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`pricingTiers.${idx}.minPackages`)}
                        disabled={isTierSaved}
                        placeholder="1"
                        className={`w-20 rounded-lg border px-3 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-colors disabled:text-white ${
                          isTierSaved
                            ? "border-white/20 bg-white/20 text-white"
                            : "border-zinc-200 bg-white"
                        }`}
                      />
                      <span className={`text-xs font-medium ${isTierSaved ? "text-white" : "text-zinc-500"}`}>
                        {pkgLabel.toLowerCase()}(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tierFields.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-600">Nenhuma embalagem cadastrada</p>
              <p className="text-xs text-zinc-400 mt-1 mb-4">
                Configure preços para diferentes tipos de embalagem e quantidades
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => appendTier({ packageType: "cx", label: "Caixa", quantityPerPackage: "12", packagePrice: "", minPackages: "1" })}
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Package className="h-3.5 w-3.5" />
                  Caixa
                </button>
                <button
                  type="button"
                  onClick={() => appendTier({ packageType: "fd", label: "Fardo", quantityPerPackage: "24", packagePrice: "", minPackages: "1" })}
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Package className="h-3.5 w-3.5" />
                  Fardo
                </button>
                <button
                  type="button"
                  onClick={() => appendTier({ packageType: "pc", label: "Pacote", quantityPerPackage: "6", packagePrice: "", minPackages: "1" })}
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Package className="h-3.5 w-3.5" />
                  Pacote
                </button>
                <button
                  type="button"
                  onClick={() => appendTier({ packageType: "un", label: "Leve 3+", quantityPerPackage: "3", packagePrice: "", minPackages: "1" })}
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Leve 3+
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===== DETAILS ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-zinc-400" />
            <label className="text-sm font-semibold text-zinc-700">
              Detalhes do produto
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendDetail({ value: "" })}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar detalhe
          </button>
        </div>
        {detailFields.length > 0 && (
          <div className="space-y-2">
            {detailFields.map((field, idx) => (
              <div
                key={field.id}
                className="flex items-center gap-2"
              >
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />
                <input
                  {...register(`details.${idx}.value`)}
                  placeholder="Ex: Sem lactose, Origem orgânica..."
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-zinc-300"
                />
                {detailFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDetail(idx)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {detailFields.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center">
            <Info className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nenhum detalhe adicionado</p>
            <p className="text-xs text-zinc-400 mt-1">
              Adicione informações como composição, conservação, etc.
            </p>
          </div>
        )}
      </div>

      {/* ===== SPECS ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-zinc-400" />
            <label className="text-sm font-semibold text-zinc-700">
              Especificações técnicas
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendSpec({ label: "", value: "" })}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar especificação
          </button>
        </div>
        {specFields.length > 0 && (
          <div className="space-y-2">
            {specFields.map((field, idx) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  {...register(`specs.${idx}.label`)}
                  placeholder="Campo"
                  className="w-full sm:w-[180px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-zinc-300"
                />
                <span className="text-zinc-300 hidden sm:inline">:</span>
                <input
                  {...register(`specs.${idx}.value`)}
                  placeholder="Valor"
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-zinc-300"
                />
                {specFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {specFields.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center">
            <List className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nenhuma especificação adicionada</p>
            <p className="text-xs text-zinc-400 mt-1">
              Adicione detalhes como peso, dimensões, material, etc.
            </p>
          </div>
        )}
      </div>

      {/* ===== IMAGES ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">Imagens do produto</h3>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Adicionar imagem
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <input type="hidden" {...register("image")} />
        <input type="hidden" {...register("images")} />

        {allImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allImages.map((img, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-zinc-100 cursor-grab active:cursor-grabbing transition-all ${
                  dragIdx === idx
                    ? "border-primary shadow-lg opacity-50 scale-95"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <img
                  src={img}
                  alt={`Produto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold rounded px-1.5 py-0.5 shadow">
                    Principal
                  </span>
                )}
                {idx > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-zinc-900/70 text-white text-[10px] font-medium rounded px-1.5 py-0.5">
                    {idx + 1}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                  className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow"
                  title="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-1.5"
            >
              <ImagePlus className="h-6 w-6 text-zinc-300" />
              <span className="text-xs text-zinc-400 font-medium">Adicionar</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer"
          >
            <ImagePlus className="h-10 w-10 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-500 font-medium">Clique para adicionar imagens</p>
            <p className="text-xs text-zinc-400 mt-1">
              Formato recomendado: <strong>500 × 500px</strong> — PNG, JPG ou WebP (máx. 5MB)
            </p>
          </div>
        )}

        {allImages.length > 0 && (
          <p className="text-[11px] text-zinc-400">
            Arraste para reordenar — a primeira imagem será a principal
          </p>
        )}
      </div>

      {/* ===== LIVE PREVIEW ===== */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-200">
          <Eye className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-700">Prévia do produto</span>
          <span className="text-xs text-zinc-400 ml-auto">Atualiza em tempo real</span>
        </div>
        <div className="p-5 space-y-6">
          {/* Top: Image left + Info right */}
          <div className="grid md:grid-cols-[340px_1fr] gap-8">
            {/* Image */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[0]}
                    alt={watchedName || "Produto"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                    <ImageIcon className="h-16 w-16 mb-3" />
                    <span className="text-sm font-medium">Sem imagem</span>
                  </div>
                )}
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      className="shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 border-zinc-200 bg-zinc-100"
                    >
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div>
                <div className="text-xs text-zinc-400 mb-0.5">
                  {watchedBrand || "Marca"}
                </div>
                <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                  {watchedName || "Nome do produto"}
                </h1>
              </div>

              {categoryName && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium px-2.5 py-0.5">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                {watchedOldPrice && parseFloat(watchedOldPrice) > 0 && (
                  <span className="text-base text-zinc-400 line-through">
                    {formatCurrency(watchedOldPrice)}
                  </span>
                )}
                <span className="text-3xl font-extrabold text-zinc-900">
                  {formatCurrency(watchedPrice)}
                </span>
                <span className="text-sm text-zinc-400">
                  /{unitLabels[watchedUnit || "un"]}
                </span>
                {discountPercent > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                    Economize{" "}
                    {formatCurrency(
                      String(
                        parseFloat(watchedOldPrice) - parseFloat(watchedPrice || "0")
                      )
                    )}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${stockColor}`}
                >
                  <span className={`h-2 w-2 rounded-full ${stockDot}`} />
                  {stockLabel}
                </span>
                <span className="text-zinc-400 text-xs">
                  ({watchedStock || "0"} disponíveis)
                </span>
              </div>

              {/* Pricing Tiers */}
              {watchedPricingTiers && watchedPricingTiers.length > 0 && (() => {
                const validTiers = watchedPricingTiers.filter(
                  (t: { quantityPerPackage: string; packagePrice: string }) =>
                    t.quantityPerPackage && t.packagePrice
                );
                if (validTiers.length === 0) return null;

                return (
                  <div className="mt-5 rounded-lg bg-primary p-5 shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/25 backdrop-blur-sm">
                        <ShoppingCart className="h-4 w-4 text-white" />
                      </span>
                      <span className="text-base font-bold text-white tracking-tight drop-shadow-sm">
                        Leve mais, pague menos
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {validTiers.map((tier: { packageType: string; label: string; quantityPerPackage: string; packagePrice: string }, i: number) => {
                        const qty = parseInt(tier.quantityPerPackage) || 1;
                        const price = parseFloat(tier.packagePrice) || 0;
                        const unitPrice = qty > 0 ? price / qty : 0;
                        const basePrice = parseFloat(watchedPrice || "0");
                        const discount = basePrice > 0 ? Math.round(((basePrice - unitPrice) / basePrice) * 100) : 0;
                        const pkgLabel =
                          tier.packageType === "cx" ? "Caixa" :
                          tier.packageType === "fd" ? "Fardo" :
                          tier.packageType === "pc" ? "Pacote" :
                          tier.packageType === "dz" ? "Dúzia" :
                          tier.packageType === "pt" ? "Peça" : "Unidade";

                        return (
                          <div key={i} className="relative rounded-lg bg-white/25 backdrop-blur-sm border border-white/30 p-5 pt-6 pr-8 text-center hover:bg-white/30 transition-colors">
                            {discount > 0 && (
                              <span className="absolute -top-3 -right-3 inline-flex items-center justify-center h-8 min-w-[32px] rounded-full bg-white text-primary text-sm font-bold shadow-lg shadow-black/20">
                                -{discount}%
                              </span>
                            )}
                            <div className="text-xs font-bold text-white uppercase tracking-widest mb-2.5">
                              {tier.label || `${pkgLabel} ${qty}un`}
                            </div>
                            <div className="text-2xl font-extrabold text-white leading-none tracking-tight drop-shadow-sm">
                              {unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>
                            <div className="text-xs text-white mt-1 font-medium">
                              /unidade
                            </div>
                            {discount > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/30">
                                <span className="text-xs text-white font-semibold">
                                  Economize {discount}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              {watchedDescription && (
                <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
                  {watchedDescription}
                </p>
              )}

              {/* Benefits */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Truck className="h-3.5 w-3.5 text-zinc-400" />
                  Frete grátis acima de R$ 99,90
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                  Garantia de 30 dias
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                  Compra 100% segura
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Heart className="h-3.5 w-3.5 text-zinc-400" />
                  Adicionar aos favoritos
                </div>
              </div>

              {/* Add to cart button */}
              <button
                type="button"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-5 py-3 transition-colors shadow-sm"
              >
                <Package className="h-4 w-4" />
                Adicionar ao carrinho
              </button>
            </div>
          </div>

          {/* Bottom: Details + Specs side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Details */}
            {validDetails.length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-zinc-400" />
                  Detalhes do produto
                </h3>
                <ul className="space-y-2">
                  {validDetails.map((d: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-zinc-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            {validSpecs.length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <List className="h-4 w-4 text-zinc-400" />
                  Especificações técnicas
                </h3>
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    {validSpecs.map(
                      (s: { label: string; value: string }, i: number) => (
                        <div key={i} className="grid grid-cols-[140px_1fr]">
                          <div className="px-3 py-2 text-xs font-medium text-zinc-500 bg-zinc-50">
                            {s.label}
                          </div>
                          <div className="px-3 py-2 text-sm text-zinc-700">
                            {s.value}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {submitLabel}
        </button>
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Package className="h-4 w-4" />
            Duplicar
          </button>
        )}
        <Link
          to="/admin/produtos/novo"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Link>
        <Link
          to="/admin/produtos"
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
