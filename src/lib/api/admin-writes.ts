import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Product, Category, Brand, Distributor, Combo, Banner, Coupon, StockMovement } from "../types";

// ============================================================
// PRODUCTS
// ============================================================

export async function apiSaveProduct(product: Product): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("products").upsert({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    details: product.details,
    specs: product.specs,
    category_id: product.categoryId,
    brand_name: product.brand,
    price: product.price,
    old_price: product.oldPrice,
    unit: product.unit,
    image: product.image,
    images: product.images,
    discount: product.discount,
    stock: product.stock,
    featured: product.featured,
    pricing_tiers: product.pricingTiers,
    active: true,
  }, { onConflict: "id" });

  if (error) throw error;

  // Sync variants
  await supabase.from("product_variants").delete().eq("product_id", product.id);
  if (product.variants.length > 0) {
    const variants = product.variants.map((v) => ({
      product_id: product.id,
      label: v.label,
      unit_price: v.unitPrice,
      old_price: v.oldPrice,
      box_price: v.boxPrice,
      box_quantity: v.boxQuantity,
      stock: v.stock,
      sku: v.sku,
      unit: v.unit,
    }));
    const { error: vErr } = await supabase.from("product_variants").insert(variants);
    if (vErr) throw vErr;
  }
}

export async function apiDeleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function apiBulkDeleteProducts(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) throw error;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function apiSaveCategory(category: Category): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("categories").upsert({
    id: category.id,
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    sort_order: category.productCount ?? 0,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// BRANDS
// ============================================================

export async function apiSaveBrand(brand: Brand): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("brands").upsert({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    active: brand.active,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteBrand(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// DISTRIBUTORS
// ============================================================

export async function apiSaveDistributor(distributor: Distributor): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("distributors").upsert({
    id: distributor.id,
    name: distributor.name,
    city: distributor.city,
    state: distributor.state,
    address: distributor.address,
    cep: distributor.cep,
    latitude: distributor.latitude,
    longitude: distributor.longitude,
    coverage_mode: distributor.coverageMode,
    coverage_radius_km: distributor.coverageRadiusKm,
    coverage_cities: distributor.coverageCities,
    color: distributor.color,
    active: distributor.active,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteDistributor(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("distributors").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// COMBOS
// ============================================================

export async function apiSaveCombo(combo: Combo): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("combos").upsert({
    id: combo.id,
    name: combo.name,
    description: combo.description,
    original_total: combo.originalTotal,
    combo_price: combo.comboPrice,
    discount_type: combo.discountType,
    discount_value: combo.discountValue,
    discount_percent: combo.discountPercent,
    badge: combo.badge,
    active: combo.active,
    sort_order: combo.order,
  }, { onConflict: "id" });

  if (error) throw error;

  // Sync combo items
  await supabase.from("combo_items").delete().eq("combo_id", combo.id);
  if (combo.items.length > 0) {
    const items = combo.items.map((i) => ({
      combo_id: combo.id,
      product_id: i.productId,
      product_name: i.productName,
      image: i.image,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));
    const { error: iErr } = await supabase.from("combo_items").insert(items);
    if (iErr) throw iErr;
  }
}

export async function apiDeleteCombo(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("combos").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// BANNERS
// ============================================================

export async function apiSaveBanner(banner: Banner): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("banners").upsert({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image: banner.image,
    mobile_image: banner.mobileImage,
    link: banner.link,
    cta_text: banner.ctaText,
    active: banner.active,
    show_title: banner.showTitle,
    show_subtitle: banner.showSubtitle,
    show_cta: banner.showCta,
    sort_order: banner.order,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteBanner(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function apiReorderBanners(orderedIds: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const updates = orderedIds.map((id, i) =>
    supabase.from("banners").update({ sort_order: i }).eq("id", id)
  );
  await Promise.all(updates);
}

// ============================================================
// COUPONS
// ============================================================

export async function apiSaveCoupon(coupon: Coupon): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("coupons").upsert({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    min_order_value: coupon.minOrderValue,
    max_uses: coupon.maxUses,
    used_count: coupon.usedCount,
    active: coupon.active,
    expires_at: coupon.expiresAt,
    per_user_limit: coupon.perUserLimit,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteCoupon(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export async function apiAddStockMovement(movement: StockMovement): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("stock_movements").insert({
    id: movement.id,
    product_id: movement.productId,
    product_name: movement.productName,
    type: movement.type,
    quantity: movement.quantity,
    previous_stock: movement.previousStock,
    new_stock: movement.newStock,
    reason: movement.reason,
  });
  if (error) throw error;
}
