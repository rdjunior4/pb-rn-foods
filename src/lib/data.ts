import type { Product, Category, Brand } from "./types";
import { loadStore } from "./admin-store";

function getAllProducts(): Product[] {
  try {
    const store = loadStore();
    if (store.products && store.products.length > 0) return store.products;
  } catch {}
  return [];
}

function getAllCategories(): Category[] {
  try {
    const store = loadStore();
    if (store.categories && store.categories.length > 0) return store.categories;
  } catch {}
  return [];
}

export function getCategories(): Category[] {
  return getAllCategories();
}

export function getProducts(): Product[] {
  return getAllProducts();
}

function getAllBrands(): Brand[] {
  try {
    const store = loadStore();
    if (store.brands && store.brands.length > 0) return store.brands;
  } catch {}
  return [];
}

export function getBrands(): Brand[] {
  return getAllBrands();
}

export function getProductById(id: string) {
  return getAllProducts().find((p) => p.id === id);
}

export function getProductBySlug(slug: string) {
  return getAllProducts().find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return getAllCategories().find((c) => c.slug === slug);
}

export function getCategoryById(id: string) {
  return getAllCategories().find((c) => c.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return getAllProducts().filter((p) => p.categoryId === categoryId);
}

export function getFeaturedProducts() {
  return getAllProducts().filter((p) => p.featured);
}

export function searchProducts(query: string) {
  const q = query.toLowerCase();
  return getAllProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
}
