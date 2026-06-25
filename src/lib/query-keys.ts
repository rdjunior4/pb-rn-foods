export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    byId: (id: string) => [...queryKeys.products.all, "id", id] as const,
    byCategory: (categoryId: string) => [...queryKeys.products.all, "category", categoryId] as const,
    featured: () => [...queryKeys.products.all, "featured"] as const,
    search: (query: string) => [...queryKeys.products.all, "search", query] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  brands: {
    all: ["brands"] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    byCustomer: (customerId: string) => [...queryKeys.orders.all, "customer", customerId] as const,
  },
  coupons: {
    all: ["coupons"] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    byProduct: (productId: string) => [...queryKeys.reviews.all, "product", productId] as const,
  },
  combos: {
    all: ["combos"] as const,
  },
  stock: {
    all: ["stock"] as const,
    byProduct: (productId: string) => [...queryKeys.stock.all, "product", productId] as const,
  },
  distributors: {
    all: ["distributors"] as const,
  },
  banners: {
    all: ["banners"] as const,
  },
  storeConfig: {
    all: ["storeConfig"] as const,
  },
  pages: {
    all: ["pages"] as const,
    bySlug: (slug: string) => [...queryKeys.pages.all, "slug", slug] as const,
  },
} as const;
