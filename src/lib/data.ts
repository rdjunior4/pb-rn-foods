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

function getAllBrands(): Brand[] {
  try {
    const store = loadStore();
    if (store.brands && store.brands.length > 0) return store.brands;
  } catch {}
  return [];
}

export function getProducts(): Product[] {
  return getAllProducts();
}

export function getCategories(): Category[] {
  return getAllCategories();
}

export function getBrands(): Brand[] {
  return getAllBrands();
}
