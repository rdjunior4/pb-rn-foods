import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Product, Category, Brand } from "../types";
import { getProducts, getCategories, getBrands } from "../data";

// Build categoryIds map from product_categories junction table
async function fetchCategoryIdsMap(): Promise<Map<string, string[]>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();
  const { data } = await supabase.from("product_categories").select("product_id, category_id");
  const map = new Map<string, string[]>();
  if (data && data.length > 0) {
    for (const row of data as Record<string, unknown>[]) {
      const pid = row.product_id as string;
      const cid = row.category_id as string;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(cid);
    }
  }
  return map;
}

export async function apiGetProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts();
  }
  const [prodsResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    fetchCategoryIdsMap(),
  ]);
  const { data, error } = prodsResult;
  if (error || !data) return getProducts();
  return data.map((row) => mapDbProduct(row, categoryIdsMap));
}

export async function apiGetProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().find((p) => p.slug === slug) || null;
  }
  const [prodResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("slug", slug)
      .single(),
    fetchCategoryIdsMap(),
  ]);
  const { data, error } = prodResult;
  if (error || !data) return null;
  return mapDbProduct(data, categoryIdsMap);
}

export async function apiGetProductById(id: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().find((p) => p.id === id) || null;
  }
  const [prodResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("id", id)
      .single(),
    fetchCategoryIdsMap(),
  ]);
  const { data, error } = prodResult;
  if (error || !data) return null;
  return mapDbProduct(data, categoryIdsMap);
}

export async function apiGetProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().filter((p) => p.categoryIds.includes(categoryId));
  }
  // Find product_ids via junction table first, plus legacy category_id fallback
  const [junctionResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId),
    fetchCategoryIdsMap(),
  ]);
  const junctionIds = (junctionResult.data || []).map((r) => r.product_id as string);

  // Also get products with legacy category_id (backward compat)
  const { data: legacyData } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId)
    .eq("active", true);

  const allIds = [...new Set([...junctionIds, ...(legacyData || []).map((r) => r.id)])];
  if (allIds.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .in("id", allIds)
    .eq("active", true);
  if (error || !data) return [];
  return data.map((row) => mapDbProduct(row, categoryIdsMap));
}

export async function apiGetFeaturedProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().filter((p) => p.featured);
  }
  const [prodsResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("featured", true)
      .eq("active", true),
    fetchCategoryIdsMap(),
  ]);
  const { data, error } = prodsResult;
  if (error || !data) return [];
  return data.map((row) => mapDbProduct(row, categoryIdsMap));
}

export async function apiSearchProducts(query: string): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    const q = query.toLowerCase();
    return getProducts().filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }
  const [prodsResult, categoryIdsMap] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .or(`name.ilike.%${query}%,brand_name.ilike.%${query}%`)
      .eq("active", true),
    fetchCategoryIdsMap(),
  ]);
  const { data, error } = prodsResult;
  if (error || !data) return [];
  return data.map((row) => mapDbProduct(row, categoryIdsMap));
}

export async function apiGetCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getCategories();
  }
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return getCategories();
  return data.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    icon: c.icon as string,
    productCount: 0,
    sortOrder: Number(c.sort_order) || 0,
  }));
}

export async function apiGetBrands(): Promise<Brand[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getBrands();
  }
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error || !data) return getBrands();
  return data.map((b: Record<string, unknown>) => ({
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    logo: b.logo as string,
    active: b.active as boolean,
    createdAt: b.created_at as string,
  }));
}

function mapDbProduct(db: Record<string, unknown>, categoryIdsMap?: Map<string, string[]>): Product {
  const primaryCategoryId = (db.category_id as string) || "";
  const junctionIds = categoryIdsMap?.get(db.id as string) || [];
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
