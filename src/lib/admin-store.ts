import type { Product, Banner, Order, Category, Brand, Distributor, ProductSeed, Combo, Coupon, ProductReview, StockMovement, Customer, CreditEntry } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

// ============================================================
// IN-MEMORY CACHE (populated by syncFromSupabase or localStorage)
// Supabase = source of truth when configured
// localStorage = fallback when Supabase is not available
// ============================================================

const LS_KEY = "@pbrn-admin-store";
const LS_ORDERS_KEY = "@pbrn-admin-orders";
const LS_COUPONS_KEY = "@pbrn-admin-coupons";
const LS_REVIEWS_KEY = "@pbrn-admin-reviews";
const LS_STOCK_KEY = "@pbrn-admin-stock";

export interface AdminStore {
  products: Product[];
  banners: Banner[];
  categories: Category[];
  brands: Brand[];
  distributors: Distributor[];
  combos: Combo[];
  customers: Customer[];
}

let _store: AdminStore = {
  products: [],
  banners: [],
  categories: [],
  brands: [],
  distributors: [],
  combos: [],
  customers: [],
};

let _orders: Order[] = [];
let _coupons: Coupon[] = [];
let _reviews: ProductReview[] = [];
let _stockMovements: StockMovement[] = [];
let _initialized = false;

// ============================================================
// LOCALSTORAGE HELPERS
// ============================================================

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function persistToLs(): void {
  if (isSupabaseConfigured()) return; // Supabase is source of truth
  lsSet(LS_KEY, _store);
  lsSet(LS_ORDERS_KEY, _orders);
  lsSet(LS_COUPONS_KEY, _coupons);
  lsSet(LS_REVIEWS_KEY, _reviews);
  lsSet(LS_STOCK_KEY, _stockMovements);
}

function loadFromLs(): void {
  if (_initialized) return;
  _initialized = true;

  const stored = lsGet<AdminStore>(LS_KEY);
  if (stored) {
    _store = stored;
  }

  _orders = lsGet<Order[]>(LS_ORDERS_KEY) || [];
  _coupons = lsGet<Coupon[]>(LS_COUPONS_KEY) || [];
  _reviews = lsGet<ProductReview[]>(LS_REVIEWS_KEY) || [];
  _stockMovements = lsGet<StockMovement[]>(LS_STOCK_KEY) || [];
}

export function loadStore(): AdminStore {
  if (!_initialized) loadFromLs();
  return _store;
}

export function saveStore(store: AdminStore): void {
  _store = store;
  persistToLs();
}

export function resetStore(): void {
  _store = {
    products: [],
    banners: [],
    categories: [],
    brands: [],
    distributors: [],
    combos: [],
    customers: [],
  };
  _orders = [];
  _coupons = [];
  _reviews = [];
  _stockMovements = [];
  persistToLs();
}

export function loadOrders(): Order[] {
  return _orders;
}

export function saveOrders(orders: Order[]): void {
  _orders = orders;
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
  const uuid = generateId().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `ORD-${uuid}`;
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

// ============================================================
// COMBOS
// ============================================================

export function getCombos(): Combo[] {
  if (!_initialized) loadFromLs();
  return _store.combos || [];
}

export function saveCombo(combo: Combo): void {
  if (!_initialized) loadFromLs();
  const idx = _store.combos.findIndex((c) => c.id === combo.id);
  if (idx >= 0) _store.combos[idx] = combo;
  else _store.combos.push(combo);
  persistToLs();
}

export function deleteCombo(id: string): void {
  if (!_initialized) loadFromLs();
  _store.combos = _store.combos.filter((c) => c.id !== id);
  persistToLs();
}

// ============================================================
// COUPONS
// ============================================================

export function loadCoupons(): Coupon[] {
  if (!_initialized) loadFromLs();
  return _coupons;
}

export function saveCoupons(coupons: Coupon[]): void {
  _coupons = coupons;
  persistToLs();
}

export function saveCoupon(coupon: Coupon): void {
  if (!_initialized) loadFromLs();
  const idx = _coupons.findIndex((c) => c.id === coupon.id);
  if (idx >= 0) _coupons[idx] = coupon;
  else _coupons.push(coupon);
  persistToLs();
}

export function deleteCoupon(id: string): void {
  if (!_initialized) loadFromLs();
  _coupons = _coupons.filter((c) => c.id !== id);
  persistToLs();
}

export function validateCoupon(
  code: string,
  orderValue: number,
  userId?: string,
): { ok: boolean; coupon?: Coupon; error?: string } {
  const coupon = _coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
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
    const userUses = _orders.filter(
      (o) => o.customerId === userId && o.couponCode === coupon.code,
    ).length;
    if (userUses >= coupon.perUserLimit) {
      return { ok: false, error: "Limite de uso por cliente atingido." };
    }
  }
  return { ok: true, coupon };
}

export function incrementCouponUsage(id: string): void {
  if (!_initialized) loadFromLs();
  const c = _coupons.find((c) => c.id === id);
  if (c) c.usedCount++;
  persistToLs();
}

// ============================================================
// REVIEWS
// ============================================================

export function loadReviews(): ProductReview[] {
  if (!_initialized) loadFromLs();
  return _reviews;
}

export function saveReviews(reviews: ProductReview[]): void {
  _reviews = reviews;
  persistToLs();
}

export function getReviewsByProduct(productId: string): ProductReview[] {
  if (!_initialized) loadFromLs();
  return _reviews.filter((r) => r.productId === productId);
}

export function addReview(review: ProductReview): void {
  if (!_initialized) loadFromLs();
  _reviews.push(review);
  persistToLs();
}

export function deleteReview(id: string): void {
  if (!_initialized) loadFromLs();
  _reviews = _reviews.filter((r) => r.id !== id);
  persistToLs();
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export function loadStockMovements(): StockMovement[] {
  if (!_initialized) loadFromLs();
  return _stockMovements;
}

export function saveStockMovements(movements: StockMovement[]): void {
  _stockMovements = movements;
  persistToLs();
}

export function addStockMovement(movement: StockMovement): void {
  if (!_initialized) loadFromLs();
  _stockMovements.unshift(movement);
  if (_stockMovements.length > 500) _stockMovements = _stockMovements.slice(0, 500);
  persistToLs();
}

export function getStockMovementsByProduct(productId: string): StockMovement[] {
  if (!_initialized) loadFromLs();
  return _stockMovements.filter((m) => m.productId === productId);
}

// ============================================================
// CUSTOMERS
// ============================================================

export function loadCustomers(): Customer[] {
  if (!_initialized) loadFromLs();
  return _store.customers;
}

export function saveCustomers(customers: Customer[]): void {
  _store.customers = customers;
  persistToLs();
}

export function getCustomerById(id: string): Customer | undefined {
  if (!_initialized) loadFromLs();
  return _store.customers.find((c) => c.id === id);
}

export function getOrCreateCustomerFromOrder(order: {
  customerName: string;
  customerEmail: string;
  customerDocument?: string;
  customerPhone?: string;
  shippingAddress?: string;
  customerId?: string;
}): Customer {
  if (!_initialized) loadFromLs();
  const id = order.customerId || order.customerEmail;
  const doc = order.customerDocument || "";

  let customer = _store.customers.find(
    (c) => c.id === id || (doc && c.document === doc),
  );

  if (!customer) {
    customer = {
      id: id || `cust_${Date.now()}`,
      name: order.customerName,
      email: order.customerEmail,
      document: doc,
      documentType: doc.length === 11 ? "cpf" : doc.length === 14 ? "cnpj" : "",
      phone: order.customerPhone || "",
      address: order.shippingAddress || "",
      city: "",
      state: "",
      createdAt: new Date().toISOString(),
      creditBalance: 0,
      creditLimit: 0,
      creditHistory: [],
      loyaltyPoints: 0,
      loyaltyLevel: "bronze",
      tags: [],
      notes: "",
    };
    _store.customers.push(customer);
    persistToLs();
  }

  return customer;
}

export function addLoyaltyPoints(customerId: string, orderTotal: number): void {
  if (!_initialized) loadFromLs();
  const customer = _store.customers.find((c) => c.id === customerId);
  if (!customer) return;

  customer.loyaltyPoints += Math.floor(orderTotal);

  if (customer.loyaltyPoints >= 5000) {
    customer.loyaltyLevel = "ouro";
  } else if (customer.loyaltyPoints >= 2000) {
    customer.loyaltyLevel = "prata";
  } else {
    customer.loyaltyLevel = "bronze";
  }
  persistToLs();
}

export function decrementStockForOrder(
  items: { productId: string; variantId?: string; quantity: number; productName: string }[],
  orderId: string,
): void {
  if (!_initialized) loadFromLs();
  const now = new Date().toISOString();
  const movements: StockMovement[] = [];

  for (const item of items) {
    const product = _store.products.find((p) => p.id === item.productId);
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

  _stockMovements.unshift(...movements);
  if (_stockMovements.length > 500) _stockMovements = _stockMovements.slice(0, 500);
  persistToLs();
}

// ============================================================
// SUPABASE SYNC — single source of truth
// ============================================================

let syncPromise: Promise<void> | null = null;

export function syncFromSupabase(): Promise<void> {
  if (syncPromise) return syncPromise;
  if (!isSupabaseConfigured()) {
    loadFromLs();
    return Promise.resolve();
  }

  syncPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const [cats, brs, prods, dists, combs, bans, cpns, revs, movs, ords, custs, credHist, prodCats] = await Promise.all([
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
        supabase.from("customers").select("*").order("created_at"),
        supabase.from("credit_history").select("*").order("created_at", { ascending: false }),
        supabase.from("product_categories").select("product_id, category_id"),
      ]);

      // Build categoryIds map from junction table
      const categoryIdsMap = new Map<string, string[]>();
      if (prodCats.data && prodCats.data.length > 0) {
        for (const row of prodCats.data as Record<string, unknown>[]) {
          const pid = row.product_id as string;
          const cid = row.category_id as string;
          if (!categoryIdsMap.has(pid)) categoryIdsMap.set(pid, []);
          categoryIdsMap.get(pid)!.push(cid);
        }
      }

      _store = {
        products: (prods.data && prods.data.length > 0) ? prods.data.map((p) => mapDbProduct(p, categoryIdsMap)) : _store.products,
        banners: (bans.data && bans.data.length > 0) ? bans.data.map(mapDbBanner) : _store.banners,
        categories: (cats.data && cats.data.length > 0) ? cats.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          slug: c.slug as string,
          name: c.name as string,
          icon: c.icon as string,
          productCount: 0,
          sortOrder: Number(c.sort_order) || 0,
        })) : _store.categories,
        brands: (brs.data && brs.data.length > 0) ? brs.data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          name: b.name as string,
          slug: b.slug as string,
          logo: b.logo as string,
          active: b.active as boolean,
          createdAt: b.created_at as string,
        })) : _store.brands,
        distributors: (dists.data && dists.data.length > 0) ? dists.data.map(mapDbDistributor) : _store.distributors,
        combos: (combs.data && combs.data.length > 0) ? combs.data.map(mapDbCombo) : _store.combos,
        customers: (custs.data && custs.data.length > 0)
          ? custs.data.map((c: Record<string, unknown>) => {
              const customer = mapDbCustomer(c);
              if (credHist.data && credHist.data.length > 0) {
                customer.creditHistory = credHist.data
                  .filter((h: Record<string, unknown>) => h.customer_id === c.id)
                  .map((h: Record<string, unknown>) => ({
                    id: h.id as string,
                    type: h.type as CreditEntry["type"],
                    amount: Number(h.amount) || 0,
                    description: (h.description as string) || "",
                    createdAt: h.created_at as string,
                  }));
              }
              return customer;
            })
          : _store.customers,
      };

      if (ords.data && ords.data.length > 0) {
        _orders = ords.data.map(mapDbOrder);
      }
      if (cpns.data && cpns.data.length > 0) {
        _coupons = cpns.data.map(mapDbCoupon);
      }
      if (revs.data && revs.data.length > 0) {
        _reviews = revs.data.map(mapDbReview);
      }
      if (movs.data && movs.data.length > 0) {
        _stockMovements = movs.data.map(mapDbMovement);
      }

      persistToLs();
    } catch (err) {
      console.error("[syncFromSupabase] erro:", err);
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

// ============================================================
// MAPPERS (DB row → app type)
// ============================================================

function mapDbProduct(db: Record<string, unknown>, categoryIdsMap?: Map<string, string[]>): Product {
  const primaryCategoryId = (db.category_id as string) || "";
  const junctionIds = categoryIdsMap?.get(db.id as string) || [];
  // categoryIds = union of junction + legacy category_id (deduplicated)
  const allCategoryIds = [...new Set([primaryCategoryId, ...junctionIds].filter(Boolean))];

  return {
    id: db.id as string,
    slug: db.slug as string,
    name: db.name as string,
    description: (db.description as string) || "",
    details: (db.details as string[]) || [],
    specs: (db.specs as { label: string; value: string }[]) || [],
    categoryId: primaryCategoryId,
    categoryIds: allCategoryIds,
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

function mapDbCustomer(db: Record<string, unknown>): Customer {
  return {
    id: db.id as string,
    name: db.name as string,
    email: db.email as string,
    document: (db.document as string) || "",
    documentType: (db.document_type as "cpf" | "cnpj") || "",
    phone: (db.phone as string) || "",
    address: (db.address as string) || "",
    city: (db.city as string) || "",
    state: (db.state as string) || "",
    createdAt: db.created_at as string,
    creditBalance: Number(db.credit_balance) || 0,
    creditLimit: Number(db.credit_limit) || 0,
    creditHistory: [],
    loyaltyPoints: Number(db.loyalty_points) || 0,
    loyaltyLevel: (db.loyalty_level as Customer["loyaltyLevel"]) || "bronze",
    tags: Array.isArray(db.tags) ? db.tags as string[] : [],
    notes: (db.notes as string) || "",
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
