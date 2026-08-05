export interface ProductVariant {
  id: string;
  label: string;
  unitPrice: number;
  oldPrice?: number | null;
  boxPrice?: number | null;
  boxQuantity?: number;
  stock: number;
  sku?: string;
  unit: string;
}

export interface PricingTier {
  id: string;
  minQuantity: number;
  pricePerUnit: number;
  discountPercent: number;
  label: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string[];
  specs: { label: string; value: string }[];
  categoryId: string;
  categoryIds: string[];
  brand: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  image: string;
  images: string[];
  discount: number | null;
  stock: number;
  featured: boolean;
  variants: ProductVariant[];
  pricingTiers: PricingTier[];
}

export type ProductSeed = Omit<Product, "description" | "images" | "variants" | "pricingTiers"> & {
  description?: string;
  images?: string[];
  variants?: ProductVariant[];
  pricingTiers?: PricingTier[];
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  productCount: number;
  sortOrder: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  comboId?: string;
  comboName?: string;
  comboDiscountPrice?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  active: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage?: string;
  link: string;
  ctaText: string;
  active: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showCta: boolean;
  order: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: string;
  shippingCarrier?: string;
  trackingCode?: string;
  estimatedDelivery?: string;
  latitude?: number;
  longitude?: number;
  distributorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoveragePoint {
  lat: number;
  lng: number;
}

export type CoverageMode = "radius" | "city";

export interface Distributor {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  latitude: number;
  longitude: number;
  coverageMode: CoverageMode;
  coverageRadiusKm: number;
  coverageCities: string[];
  color: string;
  active: boolean;
  createdAt: string;
}

export interface ComboItem {
  productId: string;
  productName: string;
  image: string;
  quantity: number;
  unitPrice: number;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  items: ComboItem[];
  originalTotal: number;
  comboPrice: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountPercent: number;
  badge?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export type CouponType = "percent" | "fixed" | "freeship";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  perUserLimit: number;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  createdBy?: string;
  createdAt: string;
}

// ============================================================
// CUSTOMER (CRM)
// ============================================================

export interface CreditEntry {
  id: string;
  type: "release" | "adjust" | "block" | "usage";
  amount: number;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  document: string;
  documentType: "cpf" | "cnpj" | "";
  phone: string;
  address: string;
  city: string;
  state: string;
  createdAt: string;
  // Crédito
  creditBalance: number;
  creditLimit: number;
  creditHistory: CreditEntry[];
  // Fidelidade
  loyaltyPoints: number;
  loyaltyLevel: "bronze" | "prata" | "ouro";
  // CRM
  tags: string[];
  notes: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentType = "credit" | "debit" | "pix" | "boleto";

export interface SavedPaymentMethod {
  id: string;
  customerId: string;
  label: string;
  cardBrand: string;
  cardLast4: string;
  cardHolder: string;
  paymentType: PaymentType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export type NotificationType = "order_update" | "promo" | "system" | "stock_alert";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// USER PREFERENCES
// ============================================================
export interface UserPreferences {
  userId: string;
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  emailStockAlerts: boolean;
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
  pushStockAlerts: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// NOTA FISCAL (NF-e)
// ============================================================

export type NfeStatus = "pendente" | "autorizada" | "cancelada" | "inutilizada";

export interface NfeConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  ie: string;
  im: string;
  crt: "1" | "2" | "3";
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  telefone: string;
  emailNfe: string;
  serie: number;
  proximoNumero: number;
}

export interface NfeItemFiscal {
  produtoId: string;
  nome: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  pesoLiquido: number;
  pesoBruto: number;
  icms: { cst: string; aliquota: number; valor: number };
  pis: { cst: string; aliquota: number; valor: number };
  cofins: { cst: string; aliquota: number; valor: number };
}

export interface NotaFiscal {
  id: string;
  orderId: string;
  numero: number;
  serie: number;
  chaveAcesso: string;
  protocolo: string;
  status: NfeStatus;
  emitente: NfeConfig;
  destinatario: {
    nome: string;
    cnpj: string;
    ie: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  items: NfeItemFiscal[];
  valorProdutos: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  valorIcms: number;
  valorPis: number;
  valorCofins: number;
  dataEmissao: string;
  dataAutorizacao?: string;
  observacoes?: string;
}

export interface ProductFiscal {
  ncm: string;
  cest: string;
  cfopPadrao: string;
  origemMercadoria: number;
  pesoLiquido: number;
  pesoBruto: number;
  icmsCst: string;
  icmsAliquota: number;
  pisCst: string;
  pisAliquota: number;
  cofinsCst: string;
  cofinsAliquota: number;
}

// ============================================================
// PAYMENTS (Rastreio de Pagamentos)
// ============================================================

export type PaymentStatus = "pending" | "processing" | "approved" | "failed" | "refunded";
export type PaymentMethod = "pix" | "boleto" | "credit_card" | "debit_card" | "cash";
export type PaymentProvider = "asaas" | "mercadopago" | "pagseguro" | "manual";

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerId?: string;
  status: PaymentStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  cardLastDigits?: string;
  cardBrand?: string;
  installments: number;
  installmentValue?: number;
  paidAt?: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ORDER HISTORY (Auditoria de Mudanças)
// ============================================================

export type OrderHistoryAction = 
  | "status_change"
  | "payment_update"
  | "note_added"
  | "stock_reserved"
  | "stock_released"
  | "other";

export type OrderAuthorRole = "customer" | "admin" | "system";

export interface OrderHistory {
  id: string;
  orderId: string;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  changedBy?: string;
  changedByName?: string;
  changedByRole?: OrderAuthorRole;
  action: OrderHistoryAction;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// ORDER NOTES (Comunicação)
// ============================================================

export interface OrderNote {
  id: string;
  orderId: string;
  authorId?: string;
  authorName: string;
  authorRole: OrderAuthorRole;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

// ============================================================
// STOCK RESERVATIONS (Reserva de Estoque)
// ============================================================

export type StockReservationStatus = "active" | "confirmed" | "cancelled";

export interface StockReservation {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  expiresAt: string;
  status: StockReservationStatus;
  createdAt: string;
}

// ============================================================
// ORDER COMPLETO (com dados expandidos)
// ============================================================

export interface OrderWithDetails extends Order {
  payments: Payment[];
  history: OrderHistory[];
  notes: OrderNote[];
  reservations: StockReservation[];
}
