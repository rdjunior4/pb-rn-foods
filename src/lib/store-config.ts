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
  footerDescription: string;
  footerPhone: string;
  footerWhatsApp: string;
  footerEmail: string;
  footerAddress: string;
  footerHours: string;
  footerSocialInstagram: string;
  footerSocialYoutube: string;
  footerSocialLinkedin: string;
  footerCnpj: string;
}

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
  footerDescription: "Distribuidora de alimentos com foco em atender empresas com variedade, qualidade e condições especiais para seu negócio crescer.",
  footerPhone: "(83) 99999-9999",
  footerWhatsApp: "5583999999999",
  footerEmail: "contato@pbrnfoods.com.br",
  footerAddress: "João Pessoa - PB",
  footerHours: "Seg a Sex: 6h - 18h | Sáb: 6h - 12h",
  footerSocialInstagram: "https://www.instagram.com/pbfoodsdistribuidora/",
  footerSocialYoutube: "https://www.youtube.com/watch?v=tlER4WXP6CU",
  footerSocialLinkedin: "https://uk.linkedin.com/company/pb-foods",
  footerCnpj: "00.000.000/0001-00",
};

// ============================================================
// IN-MEMORY CACHE (populated by syncStoreConfigFromSupabase)
// ============================================================

let _config: StoreConfig = { ...defaultConfig };

export function loadStoreConfig(): StoreConfig {
  return _config;
}

export function saveStoreConfig(config: StoreConfig): void {
  _config = config;
  persistStoreConfig(config).catch(() => {});
}

async function persistStoreConfig(config: StoreConfig): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase
      .from("store_config")
      .upsert({ id: 1, config: config as unknown as Record<string, unknown> }, { onConflict: "id" });
  } catch (err) {
    console.error("[persistStoreConfig] erro:", err);
  }
}

export function generateSectionId(): string {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// SUPABASE SYNC
// ============================================================

let syncPromise: Promise<void> | null = null;

export async function syncStoreConfigFromSupabase(): Promise<void> {
  if (syncPromise) return syncPromise;
  if (!isSupabaseConfigured()) return;

  syncPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data } = await supabase.from("store_config").select("config").eq("id", 1).single();
      if (data?.config) {
        _config = { ...defaultConfig, ...(data.config as object) };
      }
    } catch (err) {
      console.error("[syncStoreConfigFromSupabase] erro:", err);
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}
