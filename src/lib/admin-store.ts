import type { Product, Banner, Order, Category, Brand, Distributor, ProductSeed, Combo, Coupon, ProductReview, StockMovement } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

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

const defaultDistributors: Distributor[] = [];

function getInitialStore(): AdminStore {
  return {
    products: [],
    banners: [],
    categories: [],
    brands: [],
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
        if (!parsed.brands) parsed.brands = [];
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
        parsed.categories = [];
        parsed.brands = [];
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
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

// ============================================================
// SUPABASE SYNC
// Sincroniza dados do Supabase para o cache local (localStorage)
// Mantém leituras síncronas, escritas vão para Supabase + cache
// ============================================================

let syncPromise: Promise<void> | null = null;

export function syncFromSupabase(): Promise<void> {
  if (syncPromise) return syncPromise;
  if (!isSupabaseConfigured()) return Promise.resolve();

  syncPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const [cats, brs, prods, dists, combs, bans, cpns, revs, movs, ords] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("brands").select("*").order("name"),
        supabase.from("products").select("*, product_variants(*)").order("created_at", { ascending: false }),
        supabase.from("distributors").select("*").order("created_at"),
        supabase.from("combos").select("*, combo_items(*)").eq("active", true).order("sort_order"),
        supabase.from("banners").select("*").order("sort_order"),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("product_reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      ]);

      // Só sobrescrever dados se Supabase retornar dados não-vazios
      // Isso preserva dados existentes (seed) quando admin não cadastrou nada ainda
      const existingStore = loadStore();
      
      const store: AdminStore = {
        products: (prods.data && prods.data.length > 0) ? prods.data.map(mapDbProduct) : existingStore.products,
        banners: (bans.data && bans.data.length > 0) ? bans.data.map(mapDbBanner) : existingStore.banners,
        categories: (cats.data && cats.data.length > 0) ? cats.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          slug: c.slug as string,
          name: c.name as string,
          icon: c.icon as string,
          productCount: 0,
        })) : existingStore.categories,
        brands: (brs.data && brs.data.length > 0) ? brs.data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          name: b.name as string,
          slug: b.slug as string,
          logo: b.logo as string,
          active: b.active as boolean,
          createdAt: b.created_at as string,
        })) : existingStore.brands,
        distributors: (dists.data && dists.data.length > 0) ? dists.data.map(mapDbDistributor) : existingStore.distributors,
        combos: (combs.data && combs.data.length > 0) ? combs.data.map(mapDbCombo) : existingStore.combos,
      };
      saveStore(store);

      // Pedidos, cupons, avaliações e estoque: só sobrescrever se houver dados
      if (ords.data && ords.data.length > 0) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(ords.data.map(mapDbOrder)));
      }
      if (cpns.data && cpns.data.length > 0) {
        localStorage.setItem(COUPONS_KEY, JSON.stringify(cpns.data.map(mapDbCoupon)));
      }
      if (revs.data && revs.data.length > 0) {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(revs.data.map(mapDbReview)));
      }
      if (movs.data && movs.data.length > 0) {
        localStorage.setItem(STOCK_KEY, JSON.stringify(movs.data.map(mapDbMovement)));
      }
    } catch (err) {
      console.error("[syncFromSupabase] erro:", err);
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

// ---- Mappers (DB row → app type) ----

function mapDbProduct(db: Record<string, unknown>): Product {
  return {
    id: db.id as string,
    slug: db.slug as string,
    name: db.name as string,
    description: (db.description as string) || "",
    details: (db.details as string[]) || [],
    specs: (db.specs as { label: string; value: string }[]) || [],
    categoryId: (db.category_id as string) || "",
    brand: (db.brand_name as string) || "",
    price: Number(db.price) || 0,
    oldPrice: db.old_price ? Number(db.old_price) : null,
    unit: (db.unit as string) || "un",
    image: (db.image as string) || "",
    images: (db.images as string[]) || [],
    discount: db.discount ? Number(db.discount) : null,
    stock: Number(db.stock) || 0,
    featured: Boolean(db.featured),
    variants: ((db.product_variants as Record<string, unknown>[]) || []).map((v) => ({
      id: v.id as string,
      label: v.label as string,
      unitPrice: Number(v.unit_price) || 0,
      oldPrice: v.old_price ? Number(v.old_price) : null,
      boxPrice: v.box_price ? Number(v.box_price) : null,
      boxQuantity: v.box_quantity as number | undefined,
      stock: Number(v.stock) || 0,
      sku: v.sku as string | undefined,
      unit: (v.unit as string) || "un",
    })),
    pricingTiers: (db.pricing_tiers as Product["pricingTiers"]) || [],
  };
}

function mapDbBanner(db: Record<string, unknown>): Banner {
  return {
    id: db.id as string,
    title: (db.title as string) || "",
    subtitle: (db.subtitle as string) || "",
    image: (db.image as string) || "",
    mobileImage: db.mobile_image as string | undefined,
    link: (db.link as string) || "",
    ctaText: (db.cta_text as string) || "",
    active: db.active as boolean,
    showTitle: db.show_title as boolean,
    showSubtitle: db.show_subtitle as boolean,
    showCta: db.show_cta as boolean,
    order: Number(db.sort_order) || 0,
    createdAt: db.created_at as string,
  };
}

function mapDbDistributor(db: Record<string, unknown>): Distributor {
  return {
    id: db.id as string,
    name: db.name as string,
    city: db.city as string,
    state: db.state as string,
    address: (db.address as string) || "",
    cep: (db.cep as string) || "",
    latitude: Number(db.latitude) || 0,
    longitude: Number(db.longitude) || 0,
    coverageMode: db.coverage_mode as "radius" | "city",
    coverageRadiusKm: Number(db.coverage_radius_km) || 100,
    coverageCities: (db.coverage_cities as string[]) || [],
    color: (db.color as string) || "#ef4444",
    active: db.active as boolean,
    createdAt: db.created_at as string,
  };
}

function mapDbCombo(db: Record<string, unknown>): Combo {
  return {
    id: db.id as string,
    name: db.name as string,
    description: (db.description as string) || "",
    items: ((db.combo_items as Record<string, unknown>[]) || []).map((i) => ({
      productId: (i.product_id as string) || "",
      productName: i.product_name as string,
      image: (i.image as string) || "",
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unit_price) || 0,
    })),
    originalTotal: Number(db.original_total) || 0,
    comboPrice: Number(db.combo_price) || 0,
    discountType: db.discount_type as "percent" | "fixed",
    discountValue: Number(db.discount_value) || 0,
    discountPercent: Number(db.discount_percent) || 0,
    badge: db.badge as string | undefined,
    active: db.active as boolean,
    order: Number(db.sort_order) || 0,
    createdAt: db.created_at as string,
  };
}

function mapDbOrder(db: Record<string, unknown>): Order {
  return {
    id: db.id as string,
    customerId: (db.customer_id as string) || "guest",
    customerName: db.customer_name as string,
    customerEmail: db.customer_email as string,
    customerDocument: (db.customer_document as string) || "",
    customerPhone: db.customer_phone as string | undefined,
    items: ((db.order_items as Record<string, unknown>[]) || []).map((i) => ({
      productId: (i.product_id as string) || "",
      productName: i.product_name as string,
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      image: (i.image as string) || "",
    })),
    subtotal: Number(db.subtotal) || 0,
    discount: Number(db.discount) || 0,
    shippingCost: Number(db.shipping_cost) || 0,
    total: Number(db.total) || 0,
    couponCode: db.coupon_code as string | undefined,
    status: db.status as Order["status"],
    paymentMethod: db.payment_method as string,
    shippingAddress: db.shipping_address as string,
    shippingCarrier: db.shipping_carrier as string | undefined,
    trackingCode: db.tracking_code as string | undefined,
    estimatedDelivery: db.estimated_delivery as string | undefined,
    latitude: db.latitude as number | undefined,
    longitude: db.longitude as number | undefined,
    distributorId: db.distributor_id as string | undefined,
    createdAt: db.created_at as string,
    updatedAt: db.updated_at as string,
  };
}

function mapDbCoupon(db: Record<string, unknown>): Coupon {
  return {
    id: db.id as string,
    code: db.code as string,
    type: db.type as Coupon["type"],
    value: Number(db.value),
    minOrderValue: Number(db.min_order_value),
    maxUses: Number(db.max_uses),
    usedCount: Number(db.used_count),
    active: db.active as boolean,
    expiresAt: db.expires_at as string | null,
    perUserLimit: Number(db.per_user_limit),
    createdAt: db.created_at as string,
  };
}

function mapDbReview(db: Record<string, unknown>): ProductReview {
  return {
    id: db.id as string,
    productId: db.product_id as string,
    userId: db.user_id as string,
    userName: db.user_name as string,
    rating: Number(db.rating),
    comment: db.comment as string,
    createdAt: db.created_at as string,
  };
}

function mapDbMovement(db: Record<string, unknown>): StockMovement {
  return {
    id: db.id as string,
    productId: db.product_id as string,
    productName: db.product_name as string,
    type: db.type as "in" | "out" | "adjust",
    quantity: Number(db.quantity),
    previousStock: Number(db.previous_stock),
    newStock: Number(db.new_stock),
    reason: db.reason as string,
    createdAt: db.created_at as string,
  };
}
