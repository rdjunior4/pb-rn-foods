import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Order, OrderItem, OrderStatus } from "../types";

export async function apiLoadOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbOrder);
}

export async function apiGetOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapDbOrder(data);
}

export async function apiGetOrdersByCustomer(customerId: string): Promise<Order[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbOrder);
}

export async function apiSaveOrder(order: Order): Promise<string> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const orderData = {
    id: order.id,
    customer_id: order.customerId !== "guest" ? order.customerId : null,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_document: order.customerDocument,
    customer_phone: order.customerPhone,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping_cost: order.shippingCost,
    total: order.total,
    coupon_code: order.couponCode,
    status: order.status,
    payment_method: order.paymentMethod,
    shipping_address: order.shippingAddress,
    latitude: order.latitude,
    longitude: order.longitude,
    distributor_id: order.distributorId,
  };

  const { error: orderError } = await supabase.from("orders").insert(orderData);
  if (orderError) throw orderError;

  const orderItems = order.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  return order.id;
}

export async function apiCreateOrderAtomic(
  order: Order,
  couponId?: string,
): Promise<{ orderId: string; ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const orderData = {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerDocument: order.customerDocument,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shippingCost,
    total: order.total,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    latitude: order.latitude,
    longitude: order.longitude,
    distributorId: order.distributorId,
  };

  const itemsData = order.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId || "",
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
  }));

  const { data, error } = await supabase.rpc("create_order_atomic", {
    p_order: orderData,
    p_items: itemsData,
    p_coupon_code: order.couponCode || null,
    p_coupon_id: couponId || null,
  });

  if (error) throw error;
  return data as { orderId: string; ok: boolean; error?: string };
}

export async function apiUpdateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function apiDecrementStock(
  orderId: string,
  items: { productId: string; variantId?: string; quantity: number }[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.rpc("decrement_stock_for_order", {
    p_order_id: orderId,
    p_items: JSON.stringify(items),
  });
  if (error) throw error;
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
    })) as OrderItem[],
    subtotal: Number(db.subtotal) || 0,
    discount: Number(db.discount) || 0,
    shippingCost: Number(db.shipping_cost) || 0,
    total: Number(db.total) || 0,
    couponCode: db.coupon_code as string | undefined,
    status: db.status as OrderStatus,
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
