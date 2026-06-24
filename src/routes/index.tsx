import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroBanner } from "@/components/HeroBanner";
import { BrandHighlights } from "@/components/BrandHighlights";
import { BenefitsBar } from "@/components/BenefitsBar";
import { OfferProducts } from "@/components/OfferProducts";
import { CombosSection } from "@/components/CombosSection";
import {
  MoreSavingsProducts,
  BeveragesProducts,
  MeatsAndDairyProducts,
  CleaningProducts,
} from "@/components/MoreProductSections";
import { Newsletter } from "@/components/Newsletter";
import { CategoryCards } from "@/components/CategoryCards";
import { ProductSection } from "@/components/ProductSection";
import { CustomerLayout } from "@/components/CustomerLayout";
import { loadStoreConfig } from "@/lib/store-config";
import { getProducts, getProductsByCategory, getCategories } from "@/lib/data";
import type { StoreSection } from "@/lib/store-config";

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

function renderSection(section: StoreSection) {
  if (!section.active) return null;

  switch (section.type) {
    case "hero":
      return <HeroBanner key={section.id} />;

    case "brands":
      return <BrandHighlights key={section.id} />;

    case "benefits":
      return <BenefitsBar key={section.id} />;

    case "offer-products": {
      const products = getProducts()
        .filter((p) => p.discount && p.discount >= 10)
        .slice(0, section.maxProducts || 6);
      return (
        <ProductSection
          key={section.id}
          title={section.title || "Ofertas para o seu negócio"}
          subtitle={section.subtitle || "Condições exclusivas válidas por tempo limitado"}
          linkLabel="Ver todas as ofertas"
          linkTo="/buscar?q=oferta"
          products={products}
          variant={section.variant === "featured" ? "featured" : (section.variant as "default" | "alt") || "featured"}
        />
      );
    }

    case "category-products": {
      if (!section.categorySlug) return null;
      const cat = getCategories().find((c) => c.slug === section.categorySlug);
      if (!cat) return null;
      const products = getProductsByCategory(cat.id).slice(0, section.maxProducts || 6);
      return (
        <ProductSection
          key={section.id}
          title={section.title || cat.name}
          linkTo={`/categoria/${cat.slug}`}
          products={products}
          variant={(section.variant as "default" | "alt") || "default"}
        />
      );
    }

    case "newsletter":
      return <Newsletter key={section.id} />;

    case "combos":
      return <CombosSection key={section.id} />;

    case "categories-grid":
      return <CategoryCards key={section.id} />;

    case "custom-html":
      if (!section.html) return null;
      return (
        <section
          key={section.id}
          className={`mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-10 ${
            section.style === "card" ? "rounded-2xl border border-border/40 bg-card p-6" :
            section.style === "highlighted" ? "rounded-2xl border border-primary/20 bg-primary/5 p-6" :
            section.style === "gradient" ? "rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-6" :
            ""
          }`}
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
      );

    default:
      return null;
  }
}

function Index() {
  const [sections, setSections] = useState<StoreSection[]>([]);

  useEffect(() => {
    const config = loadStoreConfig();
    setSections(config.sections || []);
  }, []);

  return (
    <CustomerLayout fullWidth stickyNav={<CategoryNav />}>
      {sections.length > 0 ? (
        sections.map((section) => renderSection(section))
      ) : (
        <>
          <HeroBanner />
          <BrandHighlights />
          <BenefitsBar />
          <OfferProducts />
          <CombosSection />
          <MoreSavingsProducts />
          <BeveragesProducts />
          <MeatsAndDairyProducts />
          <CleaningProducts />
          <Newsletter />
        </>
      )}
    </CustomerLayout>
  );
}
