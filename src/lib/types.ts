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
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
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
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
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
  createdAt: string;
}
