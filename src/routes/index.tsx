import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroBanner } from "@/components/HeroBanner";
import { BrandHighlights } from "@/components/BrandHighlights";
import { BenefitsBar } from "@/components/BenefitsBar";
import { OfferProducts } from "@/components/OfferProducts";
import {
  MoreSavingsProducts,
  BeveragesProducts,
  MeatsAndDairyProducts,
  CleaningProducts,
} from "@/components/MoreProductSections";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

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
        <BrandHighlights />
        <BenefitsBar />
        <OfferProducts />
        <MoreSavingsProducts />
        <BeveragesProducts />
        <MeatsAndDairyProducts />
        <CleaningProducts />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
