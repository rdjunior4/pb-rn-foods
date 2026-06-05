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
  discount: number | null;
  stock: number;
  featured: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Brand {
  name: string;
  slug: string;
  logo: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}
