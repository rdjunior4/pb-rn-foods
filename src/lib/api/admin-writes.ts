import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Product, Category, Brand, Distributor, Combo, Banner, Coupon, StockMovement, Customer, CreditEntry } from "../types";

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
    sort_order: category.sortOrder ?? 0,
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

export async function apiReorderCategories(categories: { id: string; sortOrder: number }[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const updates = categories.map((c) =>
    supabase.from("categories").update({ sort_order: c.sortOrder }).eq("id", c.id)
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError) throw firstError.error;
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

  // Validate fields
  if (!distributor.name || distributor.name.trim().length < 2) {
    throw new Error("Nome da distribuidora é obrigatório");
  }
  if (typeof distributor.latitude !== "number" || typeof distributor.longitude !== "number" ||
      isNaN(distributor.latitude) || isNaN(distributor.longitude)) {
    throw new Error("Coordenadas inválidas");
  }
  if (distributor.coverageMode === "radius") {
    if (typeof distributor.coverageRadiusKm !== "number" ||
        distributor.coverageRadiusKm <= 0 || distributor.coverageRadiusKm > 500) {
      throw new Error("Raio de cobertura deve ser entre 1 e 500 km");
    }
  }
  if (distributor.coverageMode === "city" && (!distributor.coverageCities || distributor.coverageCities.length === 0)) {
    throw new Error("Adicione pelo menos uma cidade de cobertura");
  }
  if (distributor.coverageCities && distributor.coverageCities.length > 50) {
    throw new Error("Máximo de 50 cidades por distribuidora");
  }

  // Sanitize color — only allow hex colors
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(distributor.color) ? distributor.color : "#3b82f6";

  const { error } = await supabase.from("distributors").upsert({
    id: distributor.id,
    name: distributor.name.trim(),
    city: distributor.city,
    state: distributor.state,
    address: distributor.address,
    cep: distributor.cep,
    latitude: distributor.latitude,
    longitude: distributor.longitude,
    coverage_mode: distributor.coverageMode,
    coverage_radius_km: Math.min(distributor.coverageRadiusKm, 500),
    coverage_cities: distributor.coverageCities?.slice(0, 50) || [],
    color: safeColor,
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

// ============================================================
// CUSTOMERS
// ============================================================

export async function apiSaveCustomer(customer: Customer): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("customers").upsert({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    document: customer.document,
    document_type: customer.documentType || "cpf",
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    credit_balance: customer.creditBalance,
    credit_limit: customer.creditLimit,
    loyalty_points: customer.loyaltyPoints,
    loyalty_level: customer.loyaltyLevel,
    tags: customer.tags,
    notes: customer.notes,
    active: true,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function apiDeleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function apiAddCredit(
  customerId: string,
  amount: number,
  description: string,
  orderId?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const entry: Record<string, unknown> = {
    id: crypto.randomUUID(),
    customer_id: customerId,
    type: "release",
    amount,
    description,
  };
  if (orderId) entry.order_id = orderId;

  const { error: histErr } = await supabase.from("credit_history").insert(entry);
  if (histErr) throw histErr;

  const { error: balErr } = await supabase.rpc("increment_customer_credit", {
    p_customer_id: customerId,
    p_amount: amount,
  });
  if (balErr) {
    const { data: cust } = await supabase.from("customers").select("credit_balance").eq("id", customerId).single();
    if (cust) {
      await supabase.from("customers").update({ credit_balance: cust.credit_balance + amount }).eq("id", customerId);
    }
  }
}

export async function apiAdjustCredit(
  customerId: string,
  newBalance: number,
  description: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: cust } = await supabase.from("customers").select("credit_balance").eq("id", customerId).single();
  const diff = newBalance - (cust?.credit_balance ?? 0);

  const { error: histErr } = await supabase.from("credit_history").insert({
    id: crypto.randomUUID(),
    customer_id: customerId,
    type: "adjust",
    amount: diff,
    description,
  });
  if (histErr) throw histErr;

  const { error: balErr } = await supabase.from("customers").update({ credit_balance: newBalance }).eq("id", customerId);
  if (balErr) throw balErr;
}
