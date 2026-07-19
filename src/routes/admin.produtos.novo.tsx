import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { generateId, slugify } from "@/lib/admin-store";
import { useAdminCategories, useSaveProduct } from "@/lib/hooks";
import { ArrowLeft, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { toast } from "sonner";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/produtos/novo")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const { data: categories = [] } = useAdminCategories();
  const saveProductMutation = useSaveProduct();

  const onSubmit = async (data: ProductFormData) => {
    const price = parseFloat(data.price);
    const oldPrice = data.oldPrice ? parseFloat(data.oldPrice) : null;
    const stock = parseInt(data.stock) || 0;
    const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;

    const newProduct: Product = {
      id: generateId(),
      slug: slugify(data.name),
      name: data.name,
      description: data.description,
      details: data.details.filter((d) => d.value.trim()).map((d) => d.value),
      specs: data.specs.filter((s) => s.label.trim() && s.value.trim()),
      categoryId: data.categoryId,
      categoryIds: data.categoryIds,
      brand: data.brand,
      price,
      oldPrice,
      unit: data.unit,
      image: data.image || `https://picsum.photos/seed/${slugify(data.name)}/400/400`,
      images: data.images || (data.image ? [data.image] : []),
      discount,
      stock,
      featured: data.featured,
      variants: [],
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

    saveProductMutation.mutate(newProduct, {
      onSuccess: () => {
        toast.success("Produto criado com sucesso!");
        navigate({ to: "/admin/produtos" });
      },
      onError: (err) => {
        toast.error(`Erro ao salvar: ${err.message}`);
      },
    });
  };

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
          <h1 className="text-2xl font-bold text-zinc-900">Novo produto</h1>
          <p className="text-sm text-zinc-500 mt-1">Cadastre um novo produto no catálogo</p>
        </div>
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
            name: "",
            description: "",
            categoryId: categories[0]?.id || "",
            categoryIds: categories[0]?.id ? [categories[0].id] : [],
            brand: "",
            price: "",
            oldPrice: "",
            unit: "un",
            image: "",
            images: [],
            stock: "0",
            featured: false,
            details: [{ value: "" }],
            specs: [{ label: "", value: "" }],
            pricingTiers: [],
          }}
          onSubmit={onSubmit}
          submitLabel="Salvar produto"
        />
      </div>
    </div>
  );
}
