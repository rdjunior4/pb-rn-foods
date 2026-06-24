import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Combo, ComboItem } from "../types";

export async function apiGetCombos(): Promise<Combo[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("combos")
    .select("*, combo_items(*)")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(mapDbCombo);
}

function mapDbCombo(db: Record<string, unknown>): Combo {
  return {
    id: db.id as string,
    name: db.name as string,
    description: (db.description as string) || "",
    items: ((db.combo_items as Record<string, unknown>[]) || []).map((i) => ({
      productId: i.product_id as string,
      productName: i.product_name as string,
      image: (i.image as string) || "",
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unit_price) || 0,
    })) as ComboItem[],
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
