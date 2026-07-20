import { supabase } from "@/lib/supabase";
import type { SavedPaymentMethod, PaymentType } from "@/lib/types";

function mapPayment(row: any): SavedPaymentMethod {
  return {
    id: row.id,
    customerId: row.customer_id,
    label: row.label || "Cartao principal",
    cardBrand: row.card_brand || "",
    cardLast4: row.card_last4 || "",
    cardHolder: row.card_holder || "",
    paymentType: (row.payment_type as PaymentType) || "credit",
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BRAND_PATTERNS: Record<string, RegExp> = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  elo: /^(4011|4312|4573|5041)/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/,
};

export function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  for (const [brand, pattern] of Object.entries(BRAND_PATTERNS)) {
    if (pattern.test(clean)) return brand;
  }
  return "";
}

export async function apiGetPaymentMethods(customerId: string): Promise<SavedPaymentMethod[]> {
  const sb = supabase!;
  const { data, error } = await sb
    .from("customer_payment_methods")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPayment);
}

export async function apiSavePaymentMethod(method: Partial<SavedPaymentMethod> & { customerId: string }): Promise<SavedPaymentMethod> {
  const sb = supabase!;
  const { id, customerId, ...rest } = method;
  const row: Record<string, any> = {
    customer_id: customerId,
    label: rest.label || "Cartao principal",
    card_brand: rest.cardBrand || "",
    card_last4: rest.cardLast4 || "",
    card_holder: rest.cardHolder || "",
    payment_type: rest.paymentType || "credit",
    is_default: rest.isDefault ?? false,
  };

  if (rest.isDefault) {
    await sb
      .from("customer_payment_methods")
      .update({ is_default: false })
      .eq("customer_id", customerId);
  }

  if (id) {
    const { data, error } = await sb
      .from("customer_payment_methods")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapPayment(data);
  } else {
    const { data, error } = await sb
      .from("customer_payment_methods")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapPayment(data);
  }
}

export async function apiDeletePaymentMethod(id: string): Promise<void> {
  const sb = supabase!;
  const { error } = await sb.from("customer_payment_methods").delete().eq("id", id);
  if (error) throw error;
}

export async function apiSetDefaultPayment(customerId: string, methodId: string): Promise<void> {
  const sb = supabase!;
  const { error: resetError } = await sb
    .from("customer_payment_methods")
    .update({ is_default: false })
    .eq("customer_id", customerId);
  if (resetError) throw resetError;
  const { error } = await sb
    .from("customer_payment_methods")
    .update({ is_default: true })
    .eq("id", methodId);
  if (error) throw error;
}
