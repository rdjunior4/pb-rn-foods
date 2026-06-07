import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { loadStore, saveStore, slugify } from "@/lib/admin-store";
import { categories } from "@/lib/data";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/produtos/editar/$id")({
  component: EditProduct,
});

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: string;
  oldPrice: string;
  unit: "un" | "kg" | "fd" | "pc";
  image: string;
  stock: string;
  featured: boolean;
}

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const store = loadStore();
  const product = store.products.find((p) => p.id === id);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      brand: product.brand,
      price: product.price.toString(),
      oldPrice: product.oldPrice?.toString() || "",
      unit: product.unit,
      image: product.image,
      stock: product.stock.toString(),
      featured: product.featured,
    } : undefined,
  });

  const featured = watch("featured");

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Produto não encontrado</p>
        <Link to="/admin/produtos" className="text-primary text-sm hover:underline mt-2 inline-block">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    const store = loadStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) return;

    const price = parseFloat(data.price);
    const oldPrice = data.oldPrice ? parseFloat(data.oldPrice) : null;
    const stock = parseInt(data.stock) || 0;
    const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

    store.products[idx] = {
      ...store.products[idx],
      name: data.name,
      description: data.description,
      slug: slugify(data.name),
      categoryId: data.categoryId,
      brand: data.brand,
      price,
      oldPrice,
      unit: data.unit,
      image: data.image || `https://picsum.photos/seed/${slugify(data.name)}/400/400`,
      discount,
      stock,
      featured: data.featured,
    };

    saveStore(store);
    toast.success("Produto atualizado com sucesso!");
    navigate({ to: "/admin/produtos" });
  };

  const handleDelete = () => {
    const store = loadStore();
    store.products = store.products.filter((p) => p.id !== id);
    saveStore(store);
    toast.success("Produto removido");
    navigate({ to: "/admin/produtos" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/produtos" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar produto</h1>
            <p className="text-sm text-zinc-500 mt-1">{product.name}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>

      {confirmDelete && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">Tem certeza que deseja excluir este produto?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white text-xs font-semibold rounded-lg px-3.5 py-2 hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border bg-white p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome do produto</label>
            <input
              {...register("name", { required: "O nome é obrigatório" })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Categoria</label>
            <select
              {...register("categoryId")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Marca</label>
            <input
              {...register("brand", { required: "A marca é obrigatória" })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("price", { required: "O preço é obrigatório" })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Preço original (R$) <span className="text-zinc-400 font-normal">(opcional)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("oldPrice")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Unidade</label>
            <select
              {...register("unit")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="un">Unidade</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="fd">Fardo</option>
              <option value="pc">Pacote</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Estoque</label>
            <input
              type="number"
              min="0"
              {...register("stock")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">URL da imagem</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  {...register("image")}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              {product.image && (
                <img src={product.image} alt="" className="h-14 w-14 rounded-lg object-cover bg-zinc-100 shrink-0" />
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("featured")}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-zinc-700">Produto em destaque</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
          </button>
          <Link
            to="/admin/produtos"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
