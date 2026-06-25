import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAdminStore, useAdminBrands, useSaveBrand, useDeleteBrand } from "@/lib/hooks";
import { generateId, slugify, loadStore, saveStore } from "@/lib/admin-store";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  X,
  Upload,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Brand } from "@/lib/types";
import { readFileAsDataURL } from "@/lib/utils";
import { MAX_IMAGE_SIZE } from "@/lib/constants";

export const Route = createFileRoute("/admin/marcas")({
  component: AdminMarcas,
});

function AdminMarcas() {
  const { data: store, isLoading } = useAdminStore();
  const { data: brands = [] } = useAdminBrands();
  const saveBrand = useSaveBrand();
  const deleteBrandMutation = useDeleteBrand();

  const [search, setSearch] = useState("");
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLogo, setFormLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const getProductCount = (brandName: string) =>
    (store?.products || []).filter((p) => p.brand === brandName).length;

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
    const preview = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(preview);
    setFormLogo("");
  };

  const handleUploadConfirm = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const dataURL = await readFileAsDataURL(logoFile);
      setFormLogo(dataURL);
      setLogoPreview(dataURL);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Logo carregado");
    } catch {
      toast.error("Erro ao processar a imagem");
    }
    setUploading(false);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("O nome da marca é obrigatório");
      return;
    }

    const finalLogo = formLogo.trim() || logoPreview || "";

    if (editBrand) {
      const oldName = brands.find((b) => b.id === editBrand.id)?.name;
      const updatedBrand: Brand = {
        ...editBrand,
        name: formName.trim(),
        slug: slugify(formName),
        logo: finalLogo,
      };
      saveBrand.mutate(updatedBrand, {
        onSuccess: () => {
          if (oldName && oldName !== formName.trim()) {
            const s = loadStore();
            s.products = s.products.map((p) =>
              p.brand === oldName ? { ...p, brand: formName.trim() } : p,
            );
            saveStore(s);
          }
        },
      });
      toast.success("Marca atualizada");
    } else {
      if (brands.some((b) => b.name.toLowerCase() === formName.trim().toLowerCase())) {
        toast.error("Já existe uma marca com esse nome");
        return;
      }
      saveBrand.mutate({
        id: generateId(),
        name: formName.trim(),
        slug: slugify(formName),
        logo: finalLogo,
        active: true,
        createdAt: new Date().toISOString(),
      });
      toast.success("Marca criada");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormLogo("");
    setLogoPreview("");
    setLogoFile(null);
    setUploading(false);
    setEditBrand(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (brand: Brand) => {
    setEditBrand(brand);
    setFormName(brand.name);
    setFormLogo(brand.logo);
    setLogoPreview(brand.logo);
    setShowForm(true);
  };

  const handleDelete = (brand: Brand) => {
    const count = getProductCount(brand.name);
    if (count > 0) {
      toast.error(`Não é possível excluir. ${count} produto(s) usam esta marca.`);
      return;
    }
    deleteBrandMutation.mutate(brand.id);
    toast.success("Marca excluída");
  };

  const toggleActive = (brand: Brand) => {
    saveBrand.mutate({ ...brand, active: !brand.active });
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      {!isLoading && (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Marcas</h1>
          <p className="text-sm text-zinc-500 mt-1">{brands.length} marca(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova marca
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              {editBrand ? "Editar marca" : "Nova marca"}
            </h2>
            <button
              onClick={resetForm}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome da marca</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Ex: Nestlé"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              autoFocus
            />
          </div>

          {/* Logo */}
          <div>
            <div className="mb-3">
              <label className="text-sm font-medium text-zinc-700">Logo da marca</label>
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <Info className="h-3 w-3" /> Dimensão ideal: 200 × 200 pixels
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
              {logoPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 w-32 h-32">
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-zinc-700 text-xs font-semibold rounded-lg px-3 py-1.5"
                    >
                      Trocar
                    </button>
                    <button
                      onClick={() => {
                        setLogoPreview("");
                        setFormLogo("");
                        setLogoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="bg-red-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {logoFile && !formLogo && (
                    <div className="absolute bottom-2 right-2">
                      <button
                        onClick={handleUploadConfirm}
                        disabled={uploading}
                        className="bg-zinc-900 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {uploading ? "..." : "Confirmar"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-6 w-6 text-zinc-300" />
                  <span className="text-xs text-zinc-500">Selecionar</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-800 transition-colors"
            >
              {editBrand ? "Salvar alterações" : "Criar marca"}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar marca..."
          className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
          <Package className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {search ? "Nenhuma marca encontrada" : "Nenhuma marca cadastrada"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Marca
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                  Produtos
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((brand) => (
                <tr
                  key={brand.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt=""
                          className="h-8 w-8 rounded-lg object-contain bg-zinc-100 border border-zinc-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-zinc-400">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-zinc-900">{brand.name}</span>
                        <span className="text-xs text-zinc-400 block">{brand.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-zinc-600">
                      {getProductCount(brand.name)} produto(s)
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${brand.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {brand.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(brand)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        title={brand.active ? "Desativar" : "Ativar"}
                      >
                        {brand.active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(brand)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}
