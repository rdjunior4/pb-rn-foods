import { ProductSection } from "./ProductSection";
import { useProductsByCategory, useCategories } from "@/lib/hooks";

export function MoreSavingsProducts() {
  const { data: categories = [] } = useCategories();
  const cat = categories.find((c) => c.slug === "mercearia");
  const { data: products = [] } = useProductsByCategory(cat?.id ?? "");
  const prods = products.slice(0, 6);
  return (
    <ProductSection
      title="Mais vendidos da mercearia"
      subtitle="Itens essenciais para o seu estoque"
      linkTo="/categoria/mercearia"
      products={prods}
    />
  );
}

export function BeveragesProducts() {
  const { data: categories = [] } = useCategories();
  const cat = categories.find((c) => c.slug === "bebidas");
  const { data: products = [] } = useProductsByCategory(cat?.id ?? "");
  const prods = products.slice(0, 6);
  return (
    <ProductSection
      title="Bebidas em alta"
      subtitle="Refrigerantes, sucos, cervejas e mais"
      linkTo="/categoria/bebidas"
      products={prods}
    />
  );
}

export function MeatsAndDairyProducts() {
  const { data: categories = [] } = useCategories();
  const cats = ["carnes", "aves-pescados", "embutidos", "laticinios", "frios-queijos"];
  const catIds = cats.map((s) => categories.find((c) => c.slug === s)?.id).filter(Boolean);
  const { data: allProducts = [] } = useProductsByCategory(catIds[0] ?? "");
  const prods = allProducts.slice(0, 6);
  return (
    <ProductSection
      title="Frios, carnes e laticínios"
      subtitle="Selecionados para padarias, restaurantes e mercados"
      linkTo="/categoria/frios-queijos"
      products={prods}
    />
  );
}

export function CleaningProducts() {
  const { data: categories = [] } = useCategories();
  const cat = categories.find((c) => c.slug === "limpeza-higiene");
  const { data: products = [] } = useProductsByCategory(cat?.id ?? "");
  const prods = products.slice(0, 6);
  return (
    <ProductSection
      title="Limpeza e higiene"
      subtitle="Mantenha seu estabelecimento sempre impecável"
      linkTo="/categoria/limpeza-higiene"
      products={prods}
    />
  );
}
