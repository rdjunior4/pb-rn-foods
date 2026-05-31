import { ProductSection } from "./ProductSection";
import type { Product } from "./ProductCard";

const products: Product[] = [
  { name: "Arroz Tio João Parboilizado 5kg", oldPrice: "27,90", price: "24,90", unit: "un", discount: "-10%", emoji: "🍚" },
  { name: "Óleo de Soja Liza Pet 900ml", oldPrice: "7,49", price: "6,59", unit: "un", discount: "-12%", emoji: "🛢️" },
  { name: "Leite Integral Piracanjuba 1L", oldPrice: "5,49", price: "5,05", unit: "un", discount: "-8%", emoji: "🥛" },
  { name: "Café Pilão Tradicional 500g", oldPrice: "21,20", price: "18,59", unit: "un", discount: "-15%", emoji: "☕" },
  { name: "Contrafilé Bovino Peça a Vácuo kg", oldPrice: "49,90", price: "45,50", unit: "kg", discount: "-9%", emoji: "🥩" },
  { name: "Molho de Tomate Seara Refogado kg", oldPrice: "18,90", price: "16,79", unit: "un", discount: "-11%", emoji: "🍅" },
];

export function OfferProducts() {
  return (
    <ProductSection
      title="Ofertas para o seu negócio"
      subtitle="Condições exclusivas válidas por tempo limitado"
      linkLabel="Ver todas as ofertas"
      products={products}
    />
  );
}
