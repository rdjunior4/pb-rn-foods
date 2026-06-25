import type { Banner } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface BenefitItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  active: boolean;
}

export type SectionType =
  | "hero"
  | "brands"
  | "benefits"
  | "offer-products"
  | "category-products"
  | "combos"
  | "newsletter"
  | "categories-grid"
  | "custom-html";

export interface StoreSection {
  id: string;
  type: SectionType;
  active: boolean;
  title?: string;
  subtitle?: string;
  categorySlug?: string;
  maxProducts?: number;
  variant?: "default" | "alt" | "featured";
  html?: string;
  style?: "default" | "card" | "highlighted" | "gradient";
}

export interface StoreConfig {
  storeName: string;
  storeDescription: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaEnabled: boolean;
  heroCtaLink: string;
  heroSecondaryCtaEnabled: boolean;
  carouselEnabled: boolean;
  carouselInterval: number;
  benefits: BenefitItem[];
  featuredBrandIds: string[];
  sections: StoreSection[];
}

const CONFIG_KEY = "@pbrn-store-config";

const iconNames = [
  "ShieldCheck", "Truck", "Headset", "BadgePercent", "Star", "Clock",
  "MapPin", "CreditCard", "Gift", "Zap", "Heart", "RefreshCw",
  "Package", "CheckCircle", "Award", "ThumbsUp", "Users", "Phone",
  "Mail", "Globe", "Lock", "Key", "Eye", "Bell",
  "Tag", "Percent", "DollarSign", "Wallet", "PiggyBank", "Receipt",
  "Calendar", "Timer", "Sparkles", "Flame", "Crown", "Gem",
  "Bookmark", "Flag", "Info", "AlertTriangle", "CheckCircle2", "XCircle",
  "ArrowUp", "ArrowDown", "TrendingUp", "TrendingDown", "BarChart", "PieChart",
  "ShoppingCart", "ShoppingBag", "Store", "Warehouse", "Building", "Factory",
  "Wrench", "Settings", "Zap", "Battery", "Wifi", "Cloud",
  "Sun", "Moon", "Droplets", "Wind", "Snowflake", "Umbrella",
  "Leaf", "TreePine", "Fish", "Bird", "Dog", "Cat",
  "Pizza", "Coffee", "Wine", "Beef", "Egg", "Milk",
] as const;

export const iconOptions = [...iconNames];

export const sectionTypeLabels: Record<SectionType, string> = {
  "hero": "Banner Principal",
  "brands": "Marcas em Destaque",
  "benefits": "Barra de Benefícios",
  "offer-products": "Produtos em Oferta",
  "category-products": "Produtos por Categoria",
  "combos": "Combos Promocionais",
  "newsletter": "Newsletter",
  "categories-grid": "Grid de Categorias",
  "custom-html": "Conteúdo Personalizado",
};

export const sectionTypeIcons: Record<SectionType, string> = {
  "hero": "Image",
  "brands": "Award",
  "benefits": "ShieldCheck",
  "offer-products": "Tag",
  "category-products": "Package",
  "combos": "ShoppingBag",
  "newsletter": "Mail",
  "categories-grid": "LayoutGrid",
  "custom-html": "Code",
};

const defaultSections: StoreSection[] = [
  { id: "s1", type: "hero", active: true },
  { id: "s2", type: "brands", active: true },
  { id: "s3", type: "benefits", active: true },
  { id: "s4", type: "offer-products", active: true, title: "Ofertas imperdíveis", maxProducts: 6, variant: "featured", style: "highlighted" },
  { id: "s5", type: "category-products", active: true, title: "Mais vendidos da mercearia", categorySlug: "mercearia", maxProducts: 6, variant: "default" },
  { id: "s6", type: "category-products", active: true, title: "Bebidas em alta", categorySlug: "bebidas", maxProducts: 6, variant: "alt" },
  { id: "s7", type: "category-products", active: true, title: "Frios, carnes e laticínios", categorySlug: "carnes", maxProducts: 6, variant: "default" },
  { id: "s8", type: "category-products", active: true, title: "Limpeza e higiene", categorySlug: "limpeza-higiene", maxProducts: 6, variant: "alt" },
  { id: "s9", type: "newsletter", active: true },
];

export const defaultConfig: StoreConfig = {
  storeName: "PB&RN Foods",
  storeDescription: "Distribuidora de alimentos para o seu negócio",
  storePhone: "(83) 99999-9999",
  storeEmail: "contato@pbrnfoods.com.br",
  storeAddress: "João Pessoa - PB",
  heroEnabled: true,
  heroTitle: "Abastecimento inteligente para o seu negócio.",
  heroSubtitle: "Variedade, marcas selecionadas e logística eficiente para manter o seu negócio sempre abastecido com as melhores condições.",
  heroCtaText: "Explorar catálogo",
  heroCtaEnabled: true,
  heroCtaLink: "/buscar?q=oferta",
  heroSecondaryCtaEnabled: true,
  carouselEnabled: true,
  carouselInterval: 6000,
  benefits: [
    { id: "b1", icon: "ShieldCheck", title: "Marcas selecionadas", desc: "Parcerias com as melhores marcas do mercado.", active: true },
    { id: "b2", icon: "BadgePercent", title: "Condições exclusivas", desc: "Preços especiais e benefícios para clientes CNPJ.", active: true },
    { id: "b3", icon: "Truck", title: "Logística ágil", desc: "Entregas rápidas e pontuais em toda a região Nordeste.", active: true },
    { id: "b4", icon: "Headset", title: "Atendimento especializado", desc: "Suporte dedicado com consultores para seu negócio.", active: true },
  ],
  featuredBrandIds: [],
  sections: defaultSections,
};

export function loadStoreConfig(): StoreConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const config = {
        ...defaultConfig,
        ...parsed,
        heroEnabled: parsed.heroEnabled ?? true,
        heroCtaEnabled: parsed.heroCtaEnabled ?? true,
        heroCtaLink: parsed.heroCtaLink ?? defaultConfig.heroCtaLink,
        heroSecondaryCtaEnabled: parsed.heroSecondaryCtaEnabled ?? true,
        carouselEnabled: parsed.carouselEnabled ?? true,
        carouselInterval: parsed.carouselInterval ?? defaultConfig.carouselInterval,
        benefits: parsed.benefits || defaultConfig.benefits,
        featuredBrandIds: parsed.featuredBrandIds || [],
        sections: parsed.sections || defaultSections,
      };
      return config;
    }
  } catch {}
  syncConfigFromSupabase();
  return { ...defaultConfig };
}

async function syncConfigFromSupabase() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data } = await supabase.from("store_config").select("config").eq("id", 1).single();
    if (data?.config) {
      const config = { ...defaultConfig, ...(data.config as object) };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
  } catch {}
}

export function saveStoreConfig(config: StoreConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function generateSectionId(): string {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
