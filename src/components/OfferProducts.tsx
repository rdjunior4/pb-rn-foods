import { ProductSection } from "./ProductSection";
import { getProducts } from "@/lib/data";

export function OfferProducts() {
  const offerProducts = getProducts().filter((p) => p.discount && p.discount >= 10).slice(0, 6);
  return (
    <ProductSection
      title="Ofertas para o seu negócio"
      subtitle="Condições exclusivas válidas por tempo limitado"
      linkLabel="Ver todas as ofertas"
      linkTo="/buscar?q=oferta"
      products={offerProducts}
      variant="featured"
    />
  );
}
