import { ProductSection } from "./ProductSection";
import { useProducts } from "@/lib/hooks";

export function OfferProducts() {
  const { data: products = [] } = useProducts();
  const offerProducts = products.filter((p) => p.discount && p.discount >= 10).slice(0, 6);
  return (
    <ProductSection
      title="Ofertas para o seu negócio"
      subtitle="Condições exclusivas válidas por tempo limitado"
      linkLabel="Ver todas as ofertas"
      linkTo="/buscar"
      linkSearch={{ q: "oferta" }}
      products={offerProducts}
      variant="featured"
    />
  );
}
