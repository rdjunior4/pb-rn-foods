import type { Product, Category, Brand } from "./types";

export const categories: Category[] = [
  { id: "cat-1", slug: "mercearia", name: "Mercearia", icon: "Wheat", productCount: 12 },
  { id: "cat-2", slug: "laticinios", name: "Laticínios", icon: "Milk", productCount: 8 },
  { id: "cat-3", slug: "frios-queijos", name: "Frios e Queijos", icon: "Sandwich", productCount: 10 },
  { id: "cat-4", slug: "carnes", name: "Carnes", icon: "Beef", productCount: 6 },
  { id: "cat-5", slug: "aves-pescados", name: "Aves e Pescados", icon: "Fish", productCount: 7 },
  { id: "cat-6", slug: "embutidos", name: "Embutidos", icon: "Drumstick", productCount: 5 },
  { id: "cat-7", slug: "bebidas", name: "Bebidas", icon: "Wine", productCount: 14 },
  { id: "cat-8", slug: "molhos-temperos", name: "Molhos e Temperos", icon: "Soup", productCount: 9 },
  { id: "cat-9", slug: "limpeza-higiene", name: "Limpeza e Higiene", icon: "Spray", productCount: 11 },
];

const img = (slug: string) => `https://picsum.photos/seed/${slug}/400/400`;

const baseSpecs = (brand: string, weight: string, unit: string) => [
  { label: "Marca", value: brand },
  { label: "Peso", value: weight },
  { label: "Unidade", value: unit === "un" ? "Unidade" : unit === "kg" ? "Quilograma" : unit === "fd" ? "Fardo" : unit === "pc" ? "Pacote" : unit },
  { label: "Origem", value: "Nacional" },
  { label: "Conservação", value: "Temperatura ambiente" },
];

export const products: Product[] = [
  // Mercearia
  { id: "p1", slug: "arroz-tio-joao-5kg", name: "Arroz Tio João Parboilizado 5kg", details: ["Grãos selecionados e uniformes", "Processo de parboilização que preserva nutrientes", "Ideal para restaurantes e lanchonetes", "Rendimento superior na panela", "Embalagem hermética que preserva o frescor"], specs: [...baseSpecs("Tio João", "5kg", "un"), { label: "Tipo", value: "Parboilizado" }, { label: "Validade", value: "12 meses" }], categoryId: "cat-1", brand: "Tio João", price: 24.90, oldPrice: 27.90, unit: "un", image: img("arroz-tio-joao"), discount: 10, stock: 50, featured: true },
  { id: "p2", slug: "oleo-soja-liza-900ml", name: "Óleo de Soja Liza Pet 900ml", details: ["Óleo de soja refinado e purificado", "Alto ponto de fumaça para frituras crocantes", "Neutro, não altera o sabor dos alimentos", "Garrafa pet com alça ergonômica"], specs: [...baseSpecs("Liza", "900ml", "un"), { label: "Tipo", value: "Óleo de Soja" }, { label: "Validade", value: "18 meses" }], categoryId: "cat-1", brand: "Liza", price: 6.59, oldPrice: 7.49, unit: "un", image: img("oleo-soja-liza"), discount: 12, stock: 80, featured: true },
  { id: "p3", slug: "acucar-refinado-uniao-5kg", name: "Açúcar Refinado União 5kg", details: ["Açúcar refinado de alta pureza", "Cristais finos e homogêneos", "Dissolução rápida e uniforme", "Perfeito para confeitaria e panificação"], specs: [...baseSpecs("União", "5kg", "un"), { label: "Tipo", value: "Refinado" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-1", brand: "União", price: 19.90, oldPrice: 22.90, unit: "un", image: img("acucar-refinado-uniao"), discount: 13, stock: 40, featured: false },
  { id: "p4", slug: "feijao-carioca-camil-1kg", name: "Feijão Carioca Camil 1kg", details: ["Feijão carioca tipo 1", "Grãos selecionados e uniformes", "Pré-cozido para preparo mais rápido", "Sabor tradicional brasileiro"], specs: [...baseSpecs("Camil", "1kg", "un"), { label: "Tipo", value: "Carioca" }, { label: "Validade", value: "12 meses" }], categoryId: "cat-1", brand: "Camil", price: 7.99, oldPrice: 9.49, unit: "un", image: img("feijao-carioca-camil"), discount: 15, stock: 60, featured: false },
  { id: "p5", slug: "macarrao-espaguete-renata-500g", name: "Macarrão Espaguete Renata 500g", details: ["Massa de sêmola de trigo durum", "Textura firme e sabor autêntico", "Não gruda durante o cozimento", "Perfeito para molhos clássicos"], specs: [...baseSpecs("Renata", "500g", "un"), { label: "Tipo", value: "Espaguete" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-1", brand: "Renata", price: 4.29, oldPrice: 5.20, unit: "un", image: img("macarrao-espaguete-renata"), discount: 17, stock: 100, featured: false },
  { id: "p6", slug: "farinha-trigo-dona-benta-5kg", name: "Farinha de Trigo Dona Benta 5kg", details: ["Farinha de trigo enriquecida com ferro", "Glúten de alta qualidade", "Ideal para pães, bolos e massas", "Saco com fecho hermético"], specs: [...baseSpecs("Dona Benta", "5kg", "un"), { label: "Tipo", value: "Farinha de Trigo" }, { label: "Validade", value: "6 meses" }], categoryId: "cat-1", brand: "Dona Benta", price: 26.50, oldPrice: 29.90, unit: "un", image: img("farinha-trigo-dona-benta"), discount: 11, stock: 35, featured: false },
  { id: "p7", slug: "cafe-pilao-tradicional-500g", name: "Café Pilão Tradicional 500g", details: ["Café torrado e moído de alta qualidade", "Sabor intenso e marcante", "Aroma encorpado e duradouro", "Recomendado para consumo diário"], specs: [...baseSpecs("Pilão", "500g", "un"), { label: "Tipo", value: "Tradicional" }, { label: "Moagem", value: "Fina" }, { label: "Validade", value: "18 meses" }], categoryId: "cat-1", brand: "Pilão", price: 18.59, oldPrice: 21.20, unit: "un", image: img("cafe-pilao-tradicional"), discount: 15, stock: 45, featured: true },
  { id: "p8", slug: "sal-refinado-cisne-1kg", name: "Sal Refinado Cisne 1kg", details: ["Sal refinado iodado", "Cristais finos e uniformes", "Dissolução fácil e homogênea", "Essencial para cozinha profissional"], specs: [...baseSpecs("Cisne", "1kg", "un"), { label: "Tipo", value: "Refinado" }, { label: "Iodado", value: "Sim" }, { label: "Validade", value: "36 meses" }], categoryId: "cat-1", brand: "Cisne", price: 2.89, oldPrice: 3.49, unit: "un", image: img("sal-refinado-cisne"), discount: 17, stock: 120, featured: false },

  // Laticínios
  { id: "p9", slug: "leite-integral-piracanjuba-1l", name: "Leite Integral Piracanjuba 1L", details: ["Leite integral pasteurizado", "Rico em cálcio e vitaminas A e D", "Origem controlada e certificada", "Sabor cremoso e natural"], specs: [...baseSpecs("Piracanjuba", "1L", "un"), { label: "Tipo", value: "Integral" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "15 dias" }], categoryId: "cat-2", brand: "Piracanjuba", price: 5.05, oldPrice: 5.49, unit: "un", image: img("leite-integral-piracanjuba"), discount: 8, stock: 90, featured: true },
  { id: "p10", slug: "queijo-mussarela-tirolez-kg", name: "Queijo Mussarela Tirolez kg", details: ["Queijo mussarela tradicional", "Elaborado com leite selecionado", "Textura macia e sabor suave", "Perfeito para pizzas e lanches"], specs: [...baseSpecs("Tirolez", "1kg", "kg"), { label: "Tipo", value: "Mussarela" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "30 dias" }], categoryId: "cat-2", brand: "Tirolez", price: 42.90, oldPrice: 49.90, unit: "kg", image: img("queijo-mussarela-tirolez"), discount: 14, stock: 25, featured: false },
  { id: "p11", slug: "manteiga-aviacao-200g", name: "Manteiga Aviação com Sal 200g", details: ["Manteiga cremosa com sal", "Ingredientes naturais selecionados", "Sabor autêntico e marcante", "Ideal para pães e preparos culinários"], specs: [...baseSpecs("Aviação", "200g", "un"), { label: "Tipo", value: "Com Sal" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "90 dias" }], categoryId: "cat-2", brand: "Aviação", price: 12.49, oldPrice: 14.90, unit: "un", image: img("manteiga-aviacao"), discount: 16, stock: 55, featured: false },
  { id: "p12", slug: "iorgur-natural-integral-170g", name: "Iogurte Natural Integral 170g", details: ["Iogurte natural sem açúcar", "Leite integral fermentado", "Rico em probióticos naturais", "Textura cremosa e sabor suave"], specs: [...baseSpecs("Camponesa", "170g", "un"), { label: "Tipo", value: "Natural Integral" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "20 dias" }], categoryId: "cat-2", brand: "Camponesa", price: 3.99, oldPrice: 4.49, unit: "un", image: img("iorgur-natural-integral"), discount: 11, stock: 70, featured: false },

  // Frios e Queijos
  { id: "p13", slug: "presunto-cozido-sadia-kg", name: "Presunto Cozido Sadia kg", details: ["Presunto cozido selecionado", "Corte nobre e suculento", "Fatiado ou em peça conforme necessidade", "Sabor suave e textura macia"], specs: [...baseSpecs("Sadia", "1kg", "kg"), { label: "Tipo", value: "Cozido" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "30 dias" }], categoryId: "cat-3", brand: "Sadia", price: 33.50, oldPrice: 38.90, unit: "kg", image: img("presunto-cozido-sadia"), discount: 13, stock: 30, featured: false },
  { id: "p14", slug: "salmao-file-fresco-kg", name: "Salmão Filé Fresco kg", details: ["Filé de salmão fresco importado", "Rico em ômega-3 e proteínas", "Corte nobre sem espinhas", "Sabor delicado e textura firme"], specs: [...baseSpecs("Hemmer", "1kg", "kg"), { label: "Tipo", value: "Filé Fresco" }, { label: "Origem", value: "Chile" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "10 dias" }], categoryId: "cat-3", brand: "Hemmer", price: 79.90, oldPrice: 89.90, unit: "kg", image: img("salmao-file-fresco"), discount: 11, stock: 15, featured: true },

  // Carnes
  { id: "p15", slug: "contrafile-bovino-kg", name: "Contrafilé Bovino Peça a Vácuo kg", details: ["Contrafilé bovino selecionado", "Embalado a vácuo para maior conservação", "Corte nobre e macio", "Ideal para churrascos e grelhados"], specs: [...baseSpecs("Seara", "1kg", "kg"), { label: "Tipo", value: "Contrafilé" }, { label: "Conservação", value: "Refrigerado" }, { label: "Embalagem", value: "Vácuo" }, { label: "Validade", value: "60 dias" }], categoryId: "cat-4", brand: "Seara", price: 45.50, oldPrice: 49.90, unit: "kg", image: img("contrafile-bovino"), discount: 9, stock: 20, featured: true },

  // Bebidas
  { id: "p16", slug: "coca-cola-2l", name: "Coca-Cola Pet 2L", details: ["Refrigerante Coca-Cola sabor original", "Tradicional sabor inconfundível", "Garrafa pet 2 litros", "Perfeito para refeições e confraternizações"], specs: [...baseSpecs("Coca-Cola", "2L", "un"), { label: "Tipo", value: "Refrigerante" }, { label: "Sabor", value: "Cola" }, { label: "Validade", value: "6 meses" }], categoryId: "cat-7", brand: "Coca-Cola", price: 8.49, oldPrice: 9.99, unit: "un", image: img("coca-cola"), discount: 15, stock: 200, featured: true },
  { id: "p17", slug: "suco-del-valle-laranja-1l", name: "Suco Del Valle Laranja 1L", details: ["Suco de laranja integral", "Sem adição de açúcar", "Vitamina C natural", "Embalagem longa vida 1 litro"], specs: [...baseSpecs("Del Valle", "1L", "un"), { label: "Tipo", value: "Suco Integral" }, { label: "Sabor", value: "Laranja" }, { label: "Validade", value: "8 meses" }], categoryId: "cat-7", brand: "Del Valle", price: 7.29, oldPrice: 8.90, unit: "un", image: img("suco-del-valle"), discount: 18, stock: 85, featured: false },
  { id: "p18", slug: "agua-crystal-500ml-fd12", name: "Água Mineral Crystal 500ml Fardo 12", details: ["Água mineral natural", "Fardo com 12 unidades de 500ml", "Hidratação pura e leve", "Garrafinhas práticas para consumo individual"], specs: [...baseSpecs("Crystal", "500ml", "fd"), { label: "Tipo", value: "Água Mineral" }, { label: "Quantidade", value: "12 unidades" }, { label: "Validade", value: "12 meses" }], categoryId: "cat-7", brand: "Crystal", price: 14.90, oldPrice: 18.00, unit: "fd", image: img("agua-crystal"), discount: 17, stock: 60, featured: false },
  { id: "p19", slug: "cerveja-heineken-ln-330ml", name: "Cerveja Heineken Long Neck 330ml", details: ["Cerveja puro malte premium", "Receita original holandesa", "Sabor encorpado e refrescante", "Garrafa long neck 330ml"], specs: [...baseSpecs("Heineken", "330ml", "un"), { label: "Tipo", value: "Puro Malte" }, { label: "Teor", value: "5%" }, { label: "Validade", value: "12 meses" }], categoryId: "cat-7", brand: "Heineken", price: 6.49, oldPrice: 7.90, unit: "un", image: img("cerveja-heineken"), discount: 18, stock: 150, featured: false },
  { id: "p20", slug: "vinho-tinto-pergola-750ml", name: "Vinho Tinto Pérgola 750ml", details: ["Vinho tinto de mesa suave", "Uvas selecionadas do Vale do São Francisco", "Sabor frutado e equilibrado", "Garrafa 750ml ideal para refeições"], specs: [...baseSpecs("Pérgola", "750ml", "un"), { label: "Tipo", value: "Tinto Suave" }, { label: "Teor", value: "11%" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-7", brand: "Pérgola", price: 21.90, oldPrice: 24.90, unit: "un", image: img("vinho-tinto-pergola"), discount: 12, stock: 40, featured: false },

  // Limpeza e Higiene
  { id: "p21", slug: "detergente-ype-500ml", name: "Detergente Ypê Neutro 500ml", details: ["Detergente neutro biodegradável", "Alta concentração e rendimento", "Remove gordura com eficiência", "Suave para as mãos"], specs: [...baseSpecs("Ypê", "500ml", "un"), { label: "Tipo", value: "Neutro" }, { label: "pH", value: "Neutro" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-9", brand: "Ypê", price: 2.79, oldPrice: 3.49, unit: "un", image: img("detergente-ype"), discount: 20, stock: 95, featured: false },
  { id: "p22", slug: "agua-sanitaria-qboa-2l", name: "Água Sanitária Q'Boa 2L", details: ["Água sanitária concentrada", "Elimina germes e bactérias", "Clareia e higieniza roupas", "Ação desinfetante comprovada"], specs: [...baseSpecs("Q'Boa", "2L", "un"), { label: "Tipo", value: "Água Sanitária" }, { label: "Concentração", value: "2,5%" }, { label: "Validade", value: "6 meses" }], categoryId: "cat-9", brand: "Q'Boa", price: 7.99, oldPrice: 9.90, unit: "un", image: img("agua-sanitaria-qboa"), discount: 19, stock: 75, featured: false },
  { id: "p23", slug: "papel-higienico-neve-12un", name: "Papel Higiênico Neve Folha Dupla 12un", details: ["Papel higiênico folha dupla", "Macio e resistente", "Pacote com 12 unidades", "Creme folha dupla com relevo"], specs: [...baseSpecs("Neve", "30m", "pc"), { label: "Tipo", value: "Folha Dupla" }, { label: "Quantidade", value: "12 unidades" }, { label: "Metragem", value: "30 metros cada" }, { label: "Validade", value: "36 meses" }], categoryId: "cat-9", brand: "Neve", price: 24.90, oldPrice: 29.90, unit: "pc", image: img("papel-higienico-neve"), discount: 17, stock: 45, featured: false },
  { id: "p24", slug: "sabao-omo-1-6kg", name: "Sabão em Pó OMO 1,6kg", details: ["Sabão em pó multiação", "Remove manchas difíceis", "Perfume duradouro e agradável", "Embalagem econômica 1,6kg"], specs: [...baseSpecs("OMO", "1,6kg", "un"), { label: "Tipo", value: "Sabão em Pó" }, { label: "Ação", value: "Multiação" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-9", brand: "OMO", price: 25.50, oldPrice: 29.90, unit: "un", image: img("sabao-omo"), discount: 15, stock: 30, featured: false },

  // Molhos e Temperos
  { id: "p25", slug: "molho-tomate-seara-kg", name: "Molho de Tomate Seara Refogado kg", details: ["Molho de tomate temperado", "Pronto para uso, refogado no ponto", "Tomates selecionados e maduros", "Ideal para massas e pizzas"], specs: [...baseSpecs("Seara", "1kg", "un"), { label: "Tipo", value: "Refogado" }, { label: "Conservação", value: "Temperatura ambiente" }, { label: "Validade", value: "12 meses" }], categoryId: "cat-8", brand: "Seara", price: 16.79, oldPrice: 18.90, unit: "un", image: img("molho-tomate-seara"), discount: 11, stock: 55, featured: false },
  { id: "p26", slug: "vinagre-castelo-750ml", name: "Vinagre Castelo 750ml", details: ["Vinagre de álcool neutro", "Acidez equilibrada", "Multiuso: culinária e limpeza", "Garrafa 750ml"], specs: [...baseSpecs("Castelo", "750ml", "un"), { label: "Tipo", value: "Álcool" }, { label: "Acidez", value: "4%" }, { label: "Validade", value: "24 meses" }], categoryId: "cat-8", brand: "Castelo", price: 3.99, oldPrice: 4.90, unit: "un", image: img("vinagre-castelo"), discount: 18, stock: 90, featured: false },

  // Aves e Pescados
  { id: "p27", slug: "peito-frango-resfriado-kg", name: "Peito de Frango Resfriado kg", details: ["Peito de frango resfriado", "Corte nobre e magro", "Alto teor de proteínas", "Versátil para diversas preparações"], specs: [...baseSpecs("Sadia", "1kg", "kg"), { label: "Tipo", value: "Peito" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "15 dias" }], categoryId: "cat-5", brand: "Sadia", price: 15.90, oldPrice: 18.90, unit: "kg", image: img("peito-frango-resfriado"), discount: 15, stock: 40, featured: false },
  { id: "p28", slug: "linguiça-toscana-seara-kg", name: "Linguiça Toscana Seara kg", details: ["Linguiça toscana artesanal", "Tempero tradicional", "Suculenta e saborosa", "Ideal para churrasco e grelhados"], specs: [...baseSpecs("Seara", "1kg", "kg"), { label: "Tipo", value: "Toscana" }, { label: "Conservação", value: "Refrigerado" }, { label: "Validade", value: "20 dias" }], categoryId: "cat-6", brand: "Seara", price: 22.50, oldPrice: 26.90, unit: "kg", image: img("linguica-toscana-seara"), discount: 16, stock: 35, featured: false },
];

export const brands: Brand[] = [
  { name: "Nestlé", slug: "nestle", logo: "https://logo.clearbit.com/nestle.com" },
  { name: "Seara", slug: "seara", logo: "https://logo.clearbit.com/seara.com.br" },
  { name: "Pilão", slug: "pilao", logo: "https://logo.clearbit.com/pilao.com.br" },
  { name: "Aurora", slug: "aurora", logo: "https://logo.clearbit.com/auroraalimentos.com.br" },
  { name: "Camponesa", slug: "camponesa", logo: "https://logo.clearbit.com/laticinioscamponesa.com.br" },
  { name: "Hemmer", slug: "hemmer", logo: "https://logo.clearbit.com/hemmer.com.br" },
  { name: "Bauducco", slug: "bauducco", logo: "https://logo.clearbit.com/bauducco.com.br" },
  { name: "Yoki", slug: "yoki", logo: "https://logo.clearbit.com/yoki.com.br" },
];

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export function searchProducts(query: string) {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
}
