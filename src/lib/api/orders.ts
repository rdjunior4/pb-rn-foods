import { getSupabase, isSupabaseConfigured } from "../supabase";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  OrderHistory,
  OrderNote,
  StockReservation,
  OrderWithDetails,
  OrderHistoryAction,
} from "../types";

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

// ============================================================
// PAYMENTS
// ============================================================

export async function apiLoadPaymentsByOrder(orderId: string): Promise<Payment[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbPayment);
}

export async function apiCreatePayment(payment: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("payments")
    .insert({
      order_id: payment.orderId,
      provider: payment.provider,
      provider_id: payment.providerId,
      status: payment.status,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      transaction_id: payment.transactionId,
      pix_qr_code: payment.pixQrCode,
      pix_copy_paste: payment.pixCopyPaste,
      boleto_url: payment.boletoUrl,
      boleto_barcode: payment.boletoBarcode,
      card_last_digits: payment.cardLastDigits,
      card_brand: payment.cardBrand,
      installments: payment.installments,
      installment_value: payment.installmentValue,
      paid_at: payment.paidAt,
      expires_at: payment.expiresAt,
      metadata: payment.metadata,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapDbPayment(data);
}

export async function apiUpdatePaymentStatus(
  id: string,
  status: Payment["status"],
  paidAt?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const update: Record<string, unknown> = { status };
  if (paidAt) update.paid_at = paidAt;
  await supabase.from("payments").update(update).eq("id", id);
}

function mapDbPayment(db: Record<string, unknown>): Payment {
  return {
    id: db.id as string,
    orderId: db.order_id as string,
    provider: db.provider as Payment["provider"],
    providerId: db.provider_id as string | undefined,
    status: db.status as Payment["status"],
    amount: Number(db.amount) || 0,
    paymentMethod: db.payment_method as Payment["paymentMethod"],
    transactionId: db.transaction_id as string | undefined,
    pixQrCode: db.pix_qr_code as string | undefined,
    pixCopyPaste: db.pix_copy_paste as string | undefined,
    boletoUrl: db.boleto_url as string | undefined,
    boletoBarcode: db.boleto_barcode as string | undefined,
    cardLastDigits: db.card_last_digits as string | undefined,
    cardBrand: db.card_brand as string | undefined,
    installments: Number(db.installments) || 1,
    installmentValue: db.installment_value ? Number(db.installment_value) : undefined,
    paidAt: db.paid_at as string | undefined,
    expiresAt: db.expires_at as string | undefined,
    metadata: (db.metadata as Record<string, unknown>) || {},
    createdAt: db.created_at as string,
    updatedAt: db.updated_at as string,
  };
}

// ============================================================
// ORDER HISTORY
// ============================================================

export async function apiLoadOrderHistory(orderId: string): Promise<OrderHistory[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("order_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbOrderHistory);
}

export async function apiAddOrderHistory(
  history: Omit<OrderHistory, "id" | "createdAt">,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  await supabase.from("order_history").insert({
    order_id: history.orderId,
    old_status: history.oldStatus,
    new_status: history.newStatus,
    changed_by: history.changedBy,
    changed_by_name: history.changedByName,
    changed_by_role: history.changedByRole,
    action: history.action,
    notes: history.notes,
    metadata: history.metadata,
  });
}

function mapDbOrderHistory(db: Record<string, unknown>): OrderHistory {
  return {
    id: db.id as string,
    orderId: db.order_id as string,
    oldStatus: db.old_status as OrderHistory["oldStatus"],
    newStatus: db.new_status as OrderStatus,
    changedBy: db.changed_by as string | undefined,
    changedByName: db.changed_by_name as string | undefined,
    changedByRole: db.changed_by_role as OrderHistory["changedByRole"],
    action: db.action as OrderHistoryAction,
    notes: db.notes as string | undefined,
    metadata: (db.metadata as Record<string, unknown>) || {},
    createdAt: db.created_at as string,
  };
}

// ============================================================
// ORDER NOTES
// ============================================================

export async function apiLoadOrderNotes(orderId: string): Promise<OrderNote[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("order_notes")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbOrderNote);
}

export async function apiAddOrderNote(note: {
  orderId: string;
  authorId?: string;
  authorName: string;
  authorRole: OrderNote["authorRole"];
  content: string;
  isInternal?: boolean;
}): Promise<OrderNote | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("order_notes")
    .insert({
      order_id: note.orderId,
      author_id: note.authorId,
      author_name: note.authorName,
      author_role: note.authorRole,
      content: note.content,
      is_internal: note.isInternal ?? false,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapDbOrderNote(data);
}

function mapDbOrderNote(db: Record<string, unknown>): OrderNote {
  return {
    id: db.id as string,
    orderId: db.order_id as string,
    authorId: db.author_id as string | undefined,
    authorName: db.author_name as string,
    authorRole: db.author_role as OrderNote["authorRole"],
    content: db.content as string,
    isInternal: db.is_internal as boolean,
    createdAt: db.created_at as string,
  };
}

// ============================================================
// STOCK RESERVATIONS
// ============================================================

export async function apiLoadStockReservations(orderId: string): Promise<StockReservation[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("stock_reservations")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbStockReservation);
}

export async function apiReserveStock(
  orderId: string,
  items: { productId: string; variantId?: string; quantity: number }[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { ok: false, error: "Supabase não configurado" };
  }
  const { data, error } = await supabase.rpc("reserve_stock_for_order", {
    p_order_id: orderId,
    p_items: items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId || "",
      quantity: i.quantity,
    })),
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

function mapDbStockReservation(db: Record<string, unknown>): StockReservation {
  return {
    id: db.id as string,
    orderId: db.order_id as string,
    productId: db.product_id as string,
    variantId: db.variant_id as string | undefined,
    quantity: Number(db.quantity) || 0,
    expiresAt: db.expires_at as string,
    status: db.status as StockReservation["status"],
    createdAt: db.created_at as string,
  };
}

// ============================================================
// ORDER COMPLETO (com dados expandidos)
// ============================================================

export async function apiGetOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  
  const [order, payments, history, notes, reservations] = await Promise.all([
    apiGetOrderById(orderId),
    apiLoadPaymentsByOrder(orderId),
    apiLoadOrderHistory(orderId),
    apiLoadOrderNotes(orderId),
    apiLoadStockReservations(orderId),
  ]);

  if (!order) return null;

  return {
    ...order,
    payments,
    history,
    notes,
    reservations,
  };
}
