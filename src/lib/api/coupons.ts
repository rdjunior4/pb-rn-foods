import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Coupon } from "../types";

export async function apiValidateCoupon(
  code: string,
  orderValue: number,
  userId?: string,
): Promise<{ ok: boolean; error?: string; coupon?: Coupon }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: false, error: "Supabase não configurado" };
  }
  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: code,
    p_order_value: orderValue,
    p_user_id: userId || null,
  });
  if (error) return { ok: false, error: error.message };
  if (!data || !data.ok) return { ok: false, error: data?.error || "Cupom inválido" };

  const coupon: Coupon = {
    id: data.coupon_id,
    code: data.coupon_code,
    type: data.coupon_type,
    value: Number(data.coupon_value),
    minOrderValue: 0,
    maxUses: 0,
    usedCount: 0,
    active: true,
    expiresAt: null,
    perUserLimit: 0,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, coupon };
}

export async function apiIncrementCouponUsage(couponId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.rpc("increment_coupon_usage", { p_coupon_id: couponId });
  if (error) throw error;
}

export async function apiLoadCoupons(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    code: c.code as string,
    type: c.type as Coupon["type"],
    value: Number(c.value),
    minOrderValue: Number(c.min_order_value),
    maxUses: Number(c.max_uses),
    usedCount: Number(c.used_count),
    active: c.active as boolean,
    expiresAt: c.expires_at as string | null,
    perUserLimit: Number(c.per_user_limit),
    createdAt: c.created_at as string,
  }));
}
