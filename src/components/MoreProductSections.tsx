import { ProductSection } from "./ProductSection";
import type { Product } from "./ProductCard";

const mercearia: Product[] = [
  { name: "Açúcar Refinado União 5kg", oldPrice: "22,90", price: "19,90", unit: "un", discount: "-13%", emoji: "🧂" },
  { name: "Feijão Carioca Camil 1kg", oldPrice: "9,49", price: "7,99", unit: "un", discount: "-15%", emoji: "🫘" },
  { name: "Macarrão Espaguete Renata 500g", oldPrice: "5,20", price: "4,29", unit: "un", discount: "-17%", emoji: "🍝" },
  { name: "Farinha de Trigo Dona Benta 5kg", oldPrice: "29,90", price: "26,50", unit: "un", discount: "-11%", emoji: "🌾" },
  { name: "Sal Refinado Cisne 1kg", oldPrice: "3,49", price: "2,89", unit: "un", discount: "-17%", emoji: "🧂" },
  { name: "Vinagre Castelo 750ml", oldPrice: "4,90", price: "3,99", unit: "un", discount: "-18%", emoji: "🍶" },
];

const bebidas: Product[] = [
  { name: "Coca-Cola Pet 2L", oldPrice: "9,99", price: "8,49", unit: "un", discount: "-15%", emoji: "🥤" },
  { name: "Suco Del Valle Laranja 1L", oldPrice: "8,90", price: "7,29", unit: "un", discount: "-18%", emoji: "🧃" },
  { name: "Água Mineral Crystal 500ml Fardo 12", oldPrice: "18,00", price: "14,90", unit: "fd", discount: "-17%", emoji: "💧" },
  { name: "Cerveja Heineken Long Neck 330ml", oldPrice: "7,90", price: "6,49", unit: "un", discount: "-18%", emoji: "🍺" },
  { name: "Vinho Tinto Pérgola 750ml", oldPrice: "24,90", price: "21,90", unit: "un", discount: "-12%", emoji: "🍷" },
  { name: "Energético Red Bull 250ml", oldPrice: "11,90", price: "9,90", unit: "un", discount: "-16%", emoji: "⚡" },
];

const friosCarnes: Product[] = [
  { name: "Queijo Mussarela Tirolez kg", oldPrice: "49,90", price: "42,90", unit: "kg", discount: "-14%", emoji: "🧀" },
  { name: "Presunto Cozido Sadia kg", oldPrice: "38,90", price: "33,50", unit: "kg", discount: "-13%", emoji: "🥓" },
  { name: "Peito de Frango Resfriado kg", oldPrice: "18,90", price: "15,90", unit: "kg", discount: "-15%", emoji: "🍗" },
  { name: "Linguiça Toscana Seara kg", oldPrice: "26,90", price: "22,50", unit: "kg", discount: "-16%", emoji: "🌭" },
  { name: "Salmão Filé Fresco kg", oldPrice: "89,90", price: "79,90", unit: "kg", discount: "-11%", emoji: "🐟" },
  { name: "Manteiga Aviação com Sal 200g", oldPrice: "14,90", price: "12,49", unit: "un", discount: "-16%", emoji: "🧈" },
];

const limpezaHigiene: Product[] = [
  { name: "Detergente Ypê Neutro 500ml", oldPrice: "3,49", price: "2,79", unit: "un", discount: "-20%", emoji: "🧴" },
  { name: "Água Sanitária Qboa 2L", oldPrice: "9,90", price: "7,99", unit: "un", discount: "-19%", emoji: "🧪" },
  { name: "Papel Higiênico Neve Folha Dupla 12un", oldPrice: "29,90", price: "24,90", unit: "pc", discount: "-17%", emoji: "🧻" },
  { name: "Sabão em Pó OMO 1,6kg", oldPrice: "29,90", price: "25,50", unit: "un", discount: "-15%", emoji: "🧼" },
  { name: "Álcool 70% Itajá 1L", oldPrice: "12,90", price: "9,90", unit: "un", discount: "-23%", emoji: "🧴" },
  { name: "Esponja Multiuso Scotch 3un", oldPrice: "6,49", price: "4,99", unit: "pc", discount: "-23%", emoji: "🧽" },
];

export function MoreSavingsProducts() {
  return (
    <ProductSection
      title="Mais vendidos da mercearia"
      subtitle="Itens essenciais para o seu estoque"
      products={mercearia}
    />
  );
}

export function BeveragesProducts() {
  return (
    <ProductSection
      title="Bebidas em alta"
      subtitle="Refrigerantes, sucos, cervejas e mais"
      products={bebidas}
    />
  );
}

export function MeatsAndDairyProducts() {
  return (
    <ProductSection
      title="Frios, carnes e laticínios"
      subtitle="Selecionados para padarias, restaurantes e mercados"
      products={friosCarnes}
    />
  );
}

export function CleaningProducts() {
  return (
    <ProductSection
      title="Limpeza e higiene"
      subtitle="Mantenha seu estabelecimento sempre impecável"
      products={limpezaHigiene}
    />
  );
}
