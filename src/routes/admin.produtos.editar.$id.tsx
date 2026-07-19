import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { slugify, generateId } from "@/lib/admin-store";
import { useAdminProducts, useSaveProduct, useDeleteProduct } from "@/lib/hooks";
import { ArrowLeft, Trash2, Package, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
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

export const Route = createFileRoute("/admin/produtos/editar/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: products = [] } = useAdminProducts();
  const saveProductMutation = useSaveProduct();
  const deleteProductMutation = useDeleteProduct();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/produtos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Produto não encontrado</h1>
            <p className="text-sm text-zinc-500 mt-1">O produto solicitado não existe</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ProductFormData) => {
    const price = parseFloat(data.price);
    const oldPrice = data.oldPrice ? parseFloat(data.oldPrice) : null;
    const stock = parseInt(data.stock) || 0;
    const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

    const updated: Product = {
      ...product,
      name: data.name,
      description: data.description,
      slug: slugify(data.name),
      categoryId: data.categoryId,
      categoryIds: data.categoryIds,
      brand: data.brand,
      price,
      oldPrice,
      unit: data.unit,
      image: data.image || `https://picsum.photos/seed/${slugify(data.name)}/400/400`,
      images: data.images || (data.image ? [data.image] : product.images),
      discount,
      stock,
      featured: data.featured,
      details: data.details.filter((d) => d.value.trim()).map((d) => d.value),
      specs: data.specs.filter((s) => s.label.trim() && s.value.trim()),
      pricingTiers: (data.pricingTiers || [])
        .filter((t) => t.quantityPerPackage && t.packagePrice)
        .map((t, i) => {
          const qty = parseInt(t.quantityPerPackage) || 1;
          const p = parseFloat(t.packagePrice) || 0;
          const unitPrice = qty > 0 ? p / qty : 0;
          const basePrice = parseFloat(data.price) || 0;
          return {
            id: `tier-${Date.now()}-${i}`,
            label: t.label || `${t.packageType === "cx" ? "Caixa" : t.packageType === "fd" ? "Fardo" : t.packageType === "pc" ? "Pacote" : "Embalagem"} ${i + 1}`,
            minQuantity: parseInt(t.minPackages) || 1,
            pricePerUnit: unitPrice,
            discountPercent: basePrice > 0 ? Math.round(((basePrice - unitPrice) / basePrice) * 100) : 0,
          };
        }),
    };

    saveProductMutation.mutate(updated, {
      onSuccess: () => {
        toast.success("Produto atualizado com sucesso!");
        navigate({ to: "/admin/produtos" });
      },
      onError: (err) => {
        toast.error(`Erro ao salvar: ${err.message}`);
      },
    });
  };

  const handleDelete = () => {
    deleteProductMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Produto removido");
        navigate({ to: "/admin/produtos" });
      },
      onError: (err) => {
        toast.error(`Erro ao excluir: ${err.message}`);
      },
    });
  };

  const handleDuplicate = () => {
    const duplicate: Product = {
      ...product,
      id: generateId(),
      name: `${product.name} (Cópia)`,
      slug: slugify(`${product.name} cópia`),
    };

    saveProductMutation.mutate(duplicate, {
      onSuccess: () => {
        toast.success("Produto duplicado com sucesso!");
        navigate({ to: `/admin/produtos/editar/${duplicate.id}` });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/produtos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar produto</h1>
            <p className="text-sm text-zinc-500 mt-1">{product.name}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-red-200 text-xs font-medium px-4 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <Package className="h-4 w-4 text-zinc-600" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">Informações do produto</h2>
        </div>

        <ProductForm
          defaultValues={{
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            categoryIds: product.categoryIds,
            brand: product.brand,
            price: product.price.toString(),
            oldPrice: product.oldPrice?.toString() || "",
            unit: product.unit as "un" | "kg" | "fd" | "pc",
            image: product.image,
            images: product.images || [],
            stock: product.stock.toString(),
            featured: product.featured,
            details: product.details.length > 0 ? product.details.map((d) => ({ value: d })) : [{ value: "" }],
            specs: product.specs.length > 0 ? product.specs : [{ label: "", value: "" }],
            pricingTiers: (product.pricingTiers || []).map((t) => ({
              packageType: "un",
              label: t.label,
              quantityPerPackage: "1",
              packagePrice: t.pricePerUnit.toString(),
              minPackages: t.minQuantity.toString(),
            })),
          }}
          onSubmit={onSubmit}
          submitLabel="Salvar alterações"
          existingImage={product.image}
          existingImages={product.images || []}
          onDuplicate={handleDuplicate}
        />
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir produto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{product.name}</strong>? Esta ação não pode ser
              desfeita.
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
