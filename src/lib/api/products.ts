import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Product, Category, Brand } from "../types";
import { getProducts, getCategories, getBrands } from "../data";

export async function apiGetProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts();
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error || !data) return getProducts();
  return data.map(mapDbProduct);
}

export async function apiGetProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().find((p) => p.slug === slug) || null;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapDbProduct(data);
}

export async function apiGetProductById(id: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().find((p) => p.id === id) || null;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapDbProduct(data);
}

export async function apiGetProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().filter((p) => p.categoryId === categoryId);
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("category_id", categoryId)
    .eq("active", true);
  if (error || !data) return [];
  return data.map(mapDbProduct);
}

export async function apiGetFeaturedProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return getProducts().filter((p) => p.featured);
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("featured", true)
    .eq("active", true);
  if (error || !data) return [];
  return data.map(mapDbProduct);
}

export async function apiSearchProducts(query: string): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    const q = query.toLowerCase();
    return getProducts().filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .or(`name.ilike.%${query}%,brand_name.ilike.%${query}%`)
    .eq("active", true);
  if (error || !data) return [];
  return data.map(mapDbProduct);
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
