import type { Product, Banner } from "./types";
import { products as seedProducts } from "./data";

const STORAGE_KEY = "@pbrn-admin";

export interface AdminStore {
  products: Product[];
  banners: Banner[];
}

function getInitialStore(): AdminStore {
  return {
    products: seedProducts.map((p) => ({ ...p })),
    banners: [],
  };
}

export function loadStore(): AdminStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AdminStore;
      if (parsed.products && parsed.banners !== undefined) return parsed;
    }
  } catch {}
  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

export function saveStore(store: AdminStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
