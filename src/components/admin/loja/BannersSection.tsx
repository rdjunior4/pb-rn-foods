import { useState, useEffect, useRef } from "react";
import { loadStore, saveStore, generateId } from "@/lib/admin-store";
import { loadStoreConfig, saveStoreConfig } from "@/lib/store-config";
import type { Banner } from "@/lib/types";
import type { StoreConfig } from "@/lib/store-config";
import { readFileAsDataURL } from "@/lib/utils";
import { MAX_IMAGE_SIZE, PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  Image,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Play,
  Pause,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function BannersSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [config, setConfig] = useState<StoreConfig>(() => loadStoreConfig());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const objectURLRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("Explorar catálogo");
  const [link, setLink] = useState("/buscar?q=oferta");
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showCta, setShowCta] = useState(true);
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [mobileImage, setMobileImage] = useState("");
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState("");
  const [imageMode, setImageMode] = useState<"upload">("upload");
  const [uploading, setUploading] = useState(false);
  const [mobileUploading, setMobileUploading] = useState(false);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBanners(loadStore().banners);
    setConfig(loadStoreConfig());
  }, []);

  const refresh = () => {
    setBanners(loadStore().banners);
    setConfig(loadStoreConfig());
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setCtaText("Explorar catálogo");
    setLink("/buscar?q=oferta");
    setImage("");
    setShowTitle(true);
    setShowSubtitle(true);
    setShowCta(true);
    setImageFile(null);
    setImagePreview("");
    setMobileImage("");
    setMobileImageFile(null);
    setMobileImagePreview("");
    setUploading(false);
    setMobileUploading(false);
    setEditingId(null);
    setShowForm(false);
    if (objectURLRef.current) {
      URL.revokeObjectURL(objectURLRef.current);
      objectURLRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
  };

  const handleEdit = (b: Banner) => {
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setCtaText(b.ctaText || "");
    setLink(b.link);
    setShowTitle(b.showTitle ?? true);
    setShowSubtitle(b.showSubtitle ?? true);
    setShowCta(b.showCta ?? true);
    setImage(b.image);
    setImagePreview(b.image);
    setMobileImage(b.mobileImage || "");
    setMobileImagePreview(b.mobileImage || "");
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("A imagem deve ter no máximo 3MB");
      return;
    }
    if (objectURLRef.current) URL.revokeObjectURL(objectURLRef.current);
    const preview = URL.createObjectURL(file);
    objectURLRef.current = preview;
    setImageFile(file);
    setImagePreview(preview);
    setImage("");
  };

  const handleUploadConfirm = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const dataURL = await readFileAsDataURL(imageFile);
      setImage(dataURL);
      setImagePreview(dataURL);
      setImageFile(null);
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
        objectURLRef.current = null;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Imagem carregada");
    } catch {
      toast.error("Erro ao processar a imagem");
    }
    setUploading(false);
  };

  const handleMobileFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("A imagem deve ter no máximo 3MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setMobileImageFile(file);
    setMobileImagePreview(preview);
    setMobileImage("");
  };

  const handleMobileUploadConfirm = async () => {
    if (!mobileImageFile) return;
    setMobileUploading(true);
    try {
      const dataURL = await readFileAsDataURL(mobileImageFile);
      setMobileImage(dataURL);
      setMobileImagePreview(dataURL);
      setMobileImageFile(null);
      if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
      toast.success("Imagem mobile carregada");
    } catch {
      toast.error("Erro ao processar a imagem");
    }
    setMobileUploading(false);
  };

  const handleSave = () => {
    if (!image.trim() && !imageFile) {
      toast.error("Selecione ou insira uma imagem");
      return;
    }
    const store = loadStore();
    const finalImage =
      image || imagePreview || `https://picsum.photos/seed/banner-${Date.now()}/1400/450`;
    const finalMobileImage = mobileImage || mobileImagePreview || "";
    if (editingId) {
      const idx = store.banners.findIndex((b) => b.id === editingId);
      if (idx !== -1) {
        store.banners[idx] = {
          ...store.banners[idx],
          title,
          subtitle,
          ctaText,
          link,
          image: finalImage,
          mobileImage: finalMobileImage,
          showTitle,
          showSubtitle,
          showCta,
        };
      }
    } else {
      store.banners.push({
        id: generateId(),
        title,
        subtitle,
        ctaText,
        image: finalImage,
        mobileImage: finalMobileImage,
        link,
        active: true,
        showTitle,
        showSubtitle,
        showCta,
        order: store.banners.length,
        createdAt: new Date().toISOString(),
      });
    }
    saveStore(store);
    refresh();
    resetForm();
    toast.success(editingId ? "Banner atualizado" : "Banner criado");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const store = loadStore();
    store.banners = store.banners.filter((b) => b.id !== deleteId);
    saveStore(store);
    refresh();
    setDeleteId(null);
    toast.success("Banner removido");
  };

  const toggleActive = (id: string) => {
    const store = loadStore();
    const idx = store.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      store.banners[idx].active = !store.banners[idx].active;
      saveStore(store);
      refresh();
    }
  };

  const toggleCarousel = () => {
    const next = { ...config, carouselEnabled: !config.carouselEnabled };
    saveStoreConfig(next);
    setConfig(next);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const store = loadStore();
    [store.banners[idx], store.banners[idx - 1]] = [store.banners[idx - 1], store.banners[idx]];
    store.banners.forEach((b, i) => (b.order = i));
    saveStore(store);
    refresh();
  };

  const moveDown = (idx: number) => {
    const store = loadStore();
    if (idx === store.banners.length - 1) return;
    [store.banners[idx], store.banners[idx + 1]] = [store.banners[idx + 1], store.banners[idx]];
    store.banners.forEach((b, i) => (b.order = i));
    saveStore(store);
    refresh();
  };

  const deleteBanner = deleteId ? banners.find((b) => b.id === deleteId) : null;

  return (
    <div className="space-y-6">
      {/* Carousel toggle */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.carouselEnabled ? (
            <Play className="h-4 w-4 text-emerald-600" />
          ) : (
            <Pause className="h-4 w-4 text-zinc-400" />
          )}
          <div>
            <div className="text-sm font-medium text-zinc-900">Carrossel automático</div>
            <div className="text-xs text-zinc-400">
              {config.carouselEnabled
                ? "Os banners alternam automaticamente"
                : "Apenas o primeiro banner ativo é exibido"}
            </div>
          </div>
        </div>
        <button onClick={toggleCarousel} className="inline-flex items-center gap-2">
          {config.carouselEnabled ? (
            <ToggleRight className="h-8 w-8 text-primary cursor-pointer" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-zinc-300 cursor-pointer hover:text-zinc-400" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{banners.length} banner(s) cadastrado(s)</p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo banner
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              {editingId ? "Editar banner" : "Novo banner"}
            </h2>
            <button
              onClick={resetForm}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle fields */}
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-zinc-700">Mostrar título</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showSubtitle}
                onChange={(e) => setShowSubtitle(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-zinc-700">Mostrar subtítulo</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showCta}
                onChange={(e) => setShowCta(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-zinc-700">Mostrar botão CTA</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {showTitle && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Promoção de verão"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            )}
            {showSubtitle && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subtítulo</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Até 40% de desconto em produtos selecionados"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            )}
            {showCta && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Texto do botão CTA
                </label>
                <input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Explorar catálogo"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            )}
            {showCta && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Link do botão CTA
                </label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/buscar?q=oferta"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Image */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Desktop Image */}
            <div>
              <div className="mb-3">
                <label className="text-sm font-medium text-zinc-700">Imagem desktop</label>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Info className="h-3 w-3" /> Dimensão recomendada: 1400 × 450px
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
                    <img src={imagePreview} alt="Preview desktop" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-zinc-700 text-xs font-semibold rounded-lg px-3 py-2"
                      >
                        Trocar
                      </button>
                      <button
                        onClick={() => {
                          setImagePreview("");
                          setImage("");
                          setImageFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="bg-red-500 text-white text-xs font-semibold rounded-lg px-3 py-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {imageFile && !image && (
                      <div className="absolute bottom-3 right-3">
                        <button
                          onClick={handleUploadConfirm}
                          disabled={uploading}
                          className="bg-zinc-900 text-white text-xs font-semibold rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          {uploading ? "Processando..." : "Confirmar"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-zinc-300" />
                    <span className="text-sm text-zinc-500">Clique para selecionar</span>
                    <span className="text-xs text-zinc-400">1400 × 450px (máx. 3MB)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Image */}
            <div>
              <div className="mb-3">
                <label className="text-sm font-medium text-zinc-700">Imagem mobile</label>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Info className="h-3 w-3" /> Dimensão recomendada: 750 × 600px
                </p>
              </div>
              <div>
                <input
                  ref={mobileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMobileFileSelect}
                  className="hidden"
                />
                {mobileImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
                    <img src={mobileImagePreview} alt="Preview mobile" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <button
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="bg-white text-zinc-700 text-xs font-semibold rounded-lg px-3 py-2"
                      >
                        Trocar
                      </button>
                      <button
                        onClick={() => {
                          setMobileImagePreview("");
                          setMobileImage("");
                          setMobileImageFile(null);
                          if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
                        }}
                        className="bg-red-500 text-white text-xs font-semibold rounded-lg px-3 py-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {mobileImageFile && !mobileImage && (
                      <div className="absolute bottom-3 right-3">
                        <button
                          onClick={handleMobileUploadConfirm}
                          disabled={mobileUploading}
                          className="bg-zinc-900 text-white text-xs font-semibold rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          {mobileUploading ? "Processando..." : "Confirmar"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="w-full h-40 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-zinc-300" />
                    <span className="text-sm text-zinc-500">Clique para selecionar</span>
                    <span className="text-xs text-zinc-400">750 × 600px (máx. 3MB)</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Opcional — se não preenchido, a imagem desktop será usada no mobile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-zinc-800 transition-colors"
            >
              {editingId ? "Salvar alterações" : "Criar banner"}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {banners.length === 0 && !showForm ? (
        <div className="rounded-xl border border-zinc-200 p-12 text-center bg-white">
          <div className="h-14 w-14 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
            <Image className="h-7 w-7 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum banner cadastrado</p>
          <p className="text-xs text-zinc-400 mt-1">Crie banners para a página inicial</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`group bg-white rounded-xl border border-zinc-200 p-4 flex items-start gap-4 hover:shadow-md transition-all ${!b.active ? "opacity-50" : ""}`}
            >
              <div className="flex flex-col items-center gap-0.5 pt-1">
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
                  disabled={idx === banners.length - 1}
                  className="h-6 w-6 flex items-center justify-center text-zinc-300 hover:text-zinc-500 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-16 w-32 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-100">
                  <img
                    src={b.image}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                {b.mobileImage && (
                  <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-100 relative">
                    <img
                      src={b.mobileImage}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-zinc-900/70 text-white text-[8px] font-medium rounded px-1 py-0.5">
                      Mobile
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {b.title ? (
                    <span className="font-semibold text-zinc-900 truncate">{b.title}</span>
                  ) : (
                    <span className="text-zinc-400 italic">Sem título</span>
                  )}
                  <div className="flex gap-1">
                    {b.showTitle !== false && b.title && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        Título
                      </span>
                    )}
                    {b.showSubtitle !== false && b.subtitle && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">
                        Subtítulo
                      </span>
                    )}
                    {b.showCta !== false && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                        {b.ctaText || "CTA"}
                      </span>
                    )}
                  </div>
                </div>
                {b.subtitle && (
                  <div className="text-sm text-zinc-500 truncate mt-0.5">{b.subtitle}</div>
                )}
                <div className="text-xs text-zinc-400 mt-1 font-mono">{b.link}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleActive(b.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  title={b.active ? "Desativar" : "Ativar"}
                >
                  {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBanner && (
                <>
                  Tem certeza que deseja excluir{" "}
                  <strong>{deleteBanner.title || "este banner"}</strong>?
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
