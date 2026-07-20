import { supabase } from "@/lib/supabase";
import type { CustomerAddress } from "@/lib/types";

function mapAddress(row: any): CustomerAddress {
  return {
    id: row.id,
    customerId: row.customer_id,
    label: row.label || "Casa",
    recipientName: row.recipient_name || "",
    street: row.street || "",
    number: row.number || "",
    complement: row.complement || "",
    neighborhood: row.neighborhood || "",
    city: row.city || "",
    state: row.state || "",
    cep: row.cep || "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function apiGetAddresses(customerId: string): Promise<CustomerAddress[]> {
  const sb = supabase!;
  const { data, error } = await sb
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAddress);
}

export async function apiSaveAddress(address: Partial<CustomerAddress> & { customerId: string }): Promise<CustomerAddress> {
  const sb = supabase!;
  const { id, customerId, ...rest } = address;
  const row: Record<string, any> = {
    customer_id: customerId,
    label: rest.label || "Casa",
    recipient_name: rest.recipientName || "",
    street: rest.street || "",
    number: rest.number || "",
    complement: rest.complement || "",
    neighborhood: rest.neighborhood || "",
    city: rest.city || "",
    state: rest.state || "",
    cep: rest.cep || "",
    latitude: rest.latitude ?? null,
    longitude: rest.longitude ?? null,
    is_default: rest.isDefault ?? false,
  };

  if (rest.isDefault) {
    await sb
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId);
  }

  if (id) {
    const { data, error } = await sb
      .from("customer_addresses")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapAddress(data);
  } else {
    const { data, error } = await sb
      .from("customer_addresses")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapAddress(data);
  }
}

export async function apiDeleteAddress(id: string): Promise<void> {
  const sb = supabase!;
  const { error } = await sb.from("customer_addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function apiSetDefaultAddress(customerId: string, addressId: string): Promise<void> {
  const sb = supabase!;
  const { error: resetError } = await sb
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId);
  if (resetError) throw resetError;
  const { error } = await sb
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId);
  if (error) throw error;
}
