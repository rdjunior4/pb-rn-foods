import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryCards } from "@/components/CategoryCards";
import { BrandHighlights } from "@/components/BrandHighlights";
import { OfferProducts } from "@/components/OfferProducts";
import { BenefitsBar } from "@/components/BenefitsBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PB&RN Foods — Distribuidora de Alimentos para o seu Negócio" },
      {
        name: "description",
        content:
          "E-commerce B2B PB&RN Foods: variedade, marcas selecionadas e logística eficiente para restaurantes, hotéis, mercados e clientes CNPJ.",
      },
      { property: "og:title", content: "PB&RN Foods — Atacado para o seu negócio" },
      {
        property: "og:description",
        content:
          "Abastecimento inteligente para o seu negócio. Compre no atacado com condições exclusivas para CNPJ.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />
      <main>
        <HeroBanner />
        <CategoryCards />
        <BrandHighlights />
        <OfferProducts />
        <BenefitsBar />
      </main>
    </div>
  );
}
