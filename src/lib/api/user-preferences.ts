import { supabase } from "@/lib/supabase";
import type { UserPreferences } from "@/lib/types";

function mapPreferences(row: Record<string, unknown>): UserPreferences {
  return {
    userId: row.user_id as string,
    emailOrderUpdates: (row.email_order_updates as boolean) ?? true,
    emailPromotions: (row.email_promotions as boolean) ?? true,
    emailStockAlerts: (row.email_stock_alerts as boolean) ?? false,
    pushOrderUpdates: (row.push_order_updates as boolean) ?? true,
    pushPromotions: (row.push_promotions as boolean) ?? false,
    pushStockAlerts: (row.push_stock_alerts as boolean) ?? false,
    language: (row.language as string) ?? "pt-BR",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function apiGetPreferences(userId: string): Promise<UserPreferences | null> {
  const sb = supabase!;
  const { data, error } = await sb
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapPreferences(data) : null;
}

export async function apiSavePreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const sb = supabase!;
  const row: Record<string, unknown> = {};
  if (prefs.emailOrderUpdates !== undefined) row.email_order_updates = prefs.emailOrderUpdates;
  if (prefs.emailPromotions !== undefined) row.email_promotions = prefs.emailPromotions;
  if (prefs.emailStockAlerts !== undefined) row.email_stock_alerts = prefs.emailStockAlerts;
  if (prefs.pushOrderUpdates !== undefined) row.push_order_updates = prefs.pushOrderUpdates;
  if (prefs.pushPromotions !== undefined) row.push_promotions = prefs.pushPromotions;
  if (prefs.pushStockAlerts !== undefined) row.push_stock_alerts = prefs.pushStockAlerts;
  if (prefs.language !== undefined) row.language = prefs.language;

  const { data, error } = await sb
    .from("user_preferences")
    .upsert({ user_id: userId, ...row }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return mapPreferences(data);
}
