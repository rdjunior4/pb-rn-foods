import type { Product, Banner, Order, Category, Brand, Distributor, ProductSeed, Combo, Coupon, ProductReview, StockMovement } from "./types";
import { products as seedProducts, categories as seedCategories, brands as seedBrands } from "./data";

const STORAGE_KEY = "@pbrn-admin";
const ORDERS_KEY = "@pbrn-orders";
const COUPONS_KEY = "@pbrn-coupons";
const REVIEWS_KEY = "@pbrn-reviews";
const STOCK_KEY = "@pbrn-stock";

export interface AdminStore {
  products: Product[];
  banners: Banner[];
  categories: Category[];
  brands: Brand[];
  distributors: Distributor[];
  combos: Combo[];
}

const defaultDistributors: Distributor[] = [
  {
    id: "dist_pb",
    name: "PB Foods",
    city: "João Pessoa",
    state: "PB",
    address: "Av. Presidente Bandeira, 200",
    cep: "58013-000",
    latitude: -7.12,
    longitude: -34.86,
    coverageMode: "city",
    coverageRadiusKm: 120,
    coverageCities: [
      "João Pessoa",
      "Campina Grande",
      "Santa Rita",
      "Patos",
      "Bayeux",
      "Sousa",
      "Cajazeiras",
      "Guarabira",
      "Sapé",
      "Queimadas",
    ],
    color: "#ef4444",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dist_rn",
    name: "RN Foods",
    city: "Caicó",
    state: "RN",
    address: "Praça Augusto Severo, 100",
    cep: "59300-000",
    latitude: -6.46,
    longitude: -36.59,
    coverageMode: "city",
    coverageRadiusKm: 150,
    coverageCities: [
      "Caicó",
      "Natal",
      "Mossoró",
      "Parnamirim",
      "São Gonçalo do Amarante",
      "Macaíba",
      "Ceará-Mirim",
      "Açu",
      "Currais Novos",
      "São José de Mipibu",
    ],
    color: "#3b82f6",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function getInitialStore(): AdminStore {
  return {
    products: seedProducts.map((p) => ({
      ...p,
      description: p.description || "",
      images: p.images || (p.image ? [p.image] : []),
      variants: p.variants || [],
      pricingTiers: p.pricingTiers || [],
    })),
    banners: [],
    categories: seedCategories.map((c) => ({ ...c })),
    brands: seedBrands.map((b) => ({ ...b })),
    distributors: defaultDistributors.map((d) => ({ ...d })),
    combos: [],
  };
}

export function loadStore(): AdminStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AdminStore;
      if (parsed.products && parsed.banners !== undefined && parsed.categories !== undefined) {
        if (!parsed.brands) parsed.brands = seedBrands.map((b) => ({ ...b }));
        if (!parsed.distributors) parsed.distributors = defaultDistributors.map((d) => ({ ...d }));
        else {
          parsed.distributors = parsed.distributors.map((d: any) => ({
            ...d,
            address: d.address || "",
            cep: d.cep || "",
            coverageMode: d.coverageMode || "radius",
            coverageRadiusKm: d.coverageRadiusKm || 100,
            coverageCities: d.coverageCities || [],
          }));
        }
        if (!parsed.combos) parsed.combos = [];
        parsed.banners = parsed.banners.map((b: any) => ({
          showTitle: b.showTitle ?? true,
          showSubtitle: b.showSubtitle ?? true,
          showCta: b.showCta ?? true,
          ctaText: b.ctaText ?? "",
          ...b,
        }));
        parsed.products = parsed.products.map((p: any) => ({
          description: p.description || "",
          images: p.images || (p.image ? [p.image] : []),
          variants: p.variants || [],
          pricingTiers: p.pricingTiers || [],
          ...p,
        }));
        return parsed;
      }
      if (parsed.products && parsed.banners !== undefined) {
        parsed.categories = seedCategories.map((c) => ({ ...c }));
        parsed.brands = seedBrands.map((b) => ({ ...b }));
        parsed.distributors = defaultDistributors.map((d) => ({ ...d }));
        if (!parsed.combos) parsed.combos = [];
        parsed.banners = parsed.banners.map((b: any) => ({
          showTitle: b.showTitle ?? true,
          showSubtitle: b.showSubtitle ?? true,
          showCta: b.showCta ?? true,
          ctaText: b.ctaText ?? "",
          ...b,
        }));
        parsed.products = parsed.products.map((p: any) => ({
          description: p.description || "",
          images: p.images || (p.image ? [p.image] : []),
          variants: p.variants || [],
          pricingTiers: p.pricingTiers || [],
          ...p,
        }));
        return parsed;
      }
    }
  } catch {}
  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

export function saveStore(store: AdminStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Order[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function generateId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateOrderId(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const mi = date.getMinutes().toString().padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PN${y}${m}${d}${h}${mi}${rnd}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getCombos(): Combo[] {
  return loadStore().combos || [];
}

export function saveCombo(combo: Combo): void {
  const store = loadStore();
  const idx = store.combos.findIndex((c) => c.id === combo.id);
  if (idx >= 0) store.combos[idx] = combo;
  else store.combos.push(combo);
  saveStore(store);
}

export function deleteCombo(id: string): void {
  const store = loadStore();
  store.combos = store.combos.filter((c) => c.id !== id);
  saveStore(store);
}

export function loadCoupons(): Coupon[] {
  try {
    const stored = localStorage.getItem(COUPONS_KEY);
    if (stored) return JSON.parse(stored) as Coupon[];
  } catch {}
  return [];
}

export function saveCoupons(coupons: Coupon[]): void {
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
}

export function saveCoupon(coupon: Coupon): void {
  const coupons = loadCoupons();
  const idx = coupons.findIndex((c) => c.id === coupon.id);
  if (idx >= 0) coupons[idx] = coupon;
  else coupons.push(coupon);
  saveCoupons(coupons);
}

export function deleteCoupon(id: string): void {
  saveCoupons(loadCoupons().filter((c) => c.id !== id));
}

export function validateCoupon(
  code: string,
  orderValue: number,
  userId?: string,
): { ok: boolean; coupon?: Coupon; error?: string } {
  const coupons = loadCoupons();
  const coupon = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!coupon) return { ok: false, error: "Cupom não encontrado." };
  if (!coupon.active) return { ok: false, error: "Cupom inativo." };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, error: "Cupom expirado." };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Cupom esgotado." };
  }
  if (orderValue < coupon.minOrderValue) {
    return { ok: false, error: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2).replace(".", ",")}.` };
  }
  if (userId && coupon.perUserLimit > 0) {
    const orders = loadOrders();
    const userUses = orders.filter(
      (o) => o.customerId === userId && o.couponCode === coupon.code,
    ).length;
    if (userUses >= coupon.perUserLimit) {
      return { ok: false, error: "Limite de uso por cliente atingido." };
    }
  }
  return { ok: true, coupon };
}

export function incrementCouponUsage(id: string): void {
  const coupons = loadCoupons();
  const c = coupons.find((c) => c.id === id);
  if (c) {
    c.usedCount++;
    saveCoupons(coupons);
  }
}

export function loadReviews(): ProductReview[] {
  try {
    const stored = localStorage.getItem(REVIEWS_KEY);
    if (stored) return JSON.parse(stored) as ProductReview[];
  } catch {}
  return [];
}

export function saveReviews(reviews: ProductReview[]): void {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function getReviewsByProduct(productId: string): ProductReview[] {
  return loadReviews().filter((r) => r.productId === productId);
}

export function addReview(review: ProductReview): void {
  const reviews = loadReviews();
  reviews.push(review);
  saveReviews(reviews);
}

export function deleteReview(id: string): void {
  saveReviews(loadReviews().filter((r) => r.id !== id));
}

export function loadStockMovements(): StockMovement[] {
  try {
    const stored = localStorage.getItem(STOCK_KEY);
    if (stored) return JSON.parse(stored) as StockMovement[];
  } catch {}
  return [];
}

export function saveStockMovements(movements: StockMovement[]): void {
  localStorage.setItem(STOCK_KEY, JSON.stringify(movements));
}

export function addStockMovement(movement: StockMovement): void {
  const movements = loadStockMovements();
  movements.unshift(movement);
  saveStockMovements(movements.slice(0, 500));
}

export function getStockMovementsByProduct(productId: string): StockMovement[] {
  return loadStockMovements().filter((m) => m.productId === productId);
}

export function decrementStockForOrder(
  items: { productId: string; variantId?: string; quantity: number; productName: string }[],
  orderId: string,
): void {
  const store = loadStore();
  const now = new Date().toISOString();
  const movements: StockMovement[] = [];

  for (const item of items) {
    const product = store.products.find((p) => p.id === item.productId);
    if (!product) continue;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        const previousStock = variant.stock;
        variant.stock = Math.max(0, variant.stock - item.quantity);
        movements.push({
          id: `smv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          productId: product.id,
          productName: product.name,
          type: "out",
          quantity: item.quantity,
          previousStock,
          newStock: variant.stock,
          reason: `Venda — pedido ${orderId}`,
          createdAt: now,
        });
      }
    }

    const previousStock = product.stock;
    product.stock = Math.max(0, product.stock - item.quantity);
    movements.push({
      id: `smv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId: product.id,
      productName: product.name,
      type: "out",
      quantity: item.quantity,
      previousStock,
      newStock: product.stock,
      reason: `Venda — pedido ${orderId}`,
      createdAt: now,
    });
  }

  saveStore(store);

  const allMovements = loadStockMovements();
  allMovements.unshift(...movements);
  saveStockMovements(allMovements.slice(0, 500));
}
