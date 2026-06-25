import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
  loadStore,
  saveStore,
  loadOrders,
  saveOrders,
  loadCoupons,
  saveCoupon,
  deleteCoupon,
  loadReviews,
  deleteReview,
  loadStockMovements,
  addStockMovement,
  getCombos,
  saveCombo,
  deleteCombo,
  generateId,
} from "../admin-store";
import type { Product, Category, Brand, Order, Coupon, ProductReview, StockMovement, Distributor, Combo } from "../types";

// ─── Dashboard ───
export function useAdminStore() {
  return useQuery({
    queryKey: ["admin", "store"] as const,
    queryFn: () => loadStore(),
    staleTime: 30 * 1000,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => loadOrders(),
    staleTime: 30 * 1000,
  });
}

// ─── Products ───
export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => loadStore().products,
    staleTime: 30 * 1000,
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const store = loadStore();
      const idx = store.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) store.products[idx] = product;
      else store.products.push(product);
      saveStore(store);
      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const store = loadStore();
      store.products = store.products.filter((p) => p.id !== id);
      saveStore(store);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const store = loadStore();
      store.products = store.products.filter((p) => !ids.includes(p.id));
      saveStore(store);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

// ─── Categories ───
export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => loadStore().categories,
    staleTime: 30 * 1000,
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: Category) => {
      const store = loadStore();
      const idx = store.categories.findIndex((c) => c.id === category.id);
      if (idx >= 0) store.categories[idx] = category;
      else store.categories.push(category);
      saveStore(store);
      return category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const store = loadStore();
      store.products.forEach((p) => {
        if (p.categoryId === id) p.categoryId = "";
      });
      store.categories = store.categories.filter((c) => c.id !== id);
      saveStore(store);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

// ─── Brands ───
export function useAdminBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () => loadStore().brands,
    staleTime: 30 * 1000,
  });
}

export function useSaveBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (brand: Brand) => {
      const store = loadStore();
      const idx = store.brands.findIndex((b) => b.id === brand.id);
      if (idx >= 0) store.brands[idx] = brand;
      else store.brands.push(brand);
      saveStore(store);
      return brand;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.brands.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const store = loadStore();
      store.brands = store.brands.filter((b) => b.id !== id);
      saveStore(store);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.brands.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

// ─── Orders ───
export function useAdminAdvanceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const orders = loadOrders();
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Pedido não encontrado");
      const nextMap: Record<string, string> = {
        pending: "confirmed",
        confirmed: "preparing",
        preparing: "shipped",
        shipped: "delivered",
      };
      const next = nextMap[order.status];
      if (!next) throw new Error("Status inválido");
      order.status = next as Order["status"];
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useAdminCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const orders = loadOrders();
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Pedido não encontrado");
      order.status = "cancelled";
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

// ─── Coupons ───
export function useAdminCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons.all,
    queryFn: () => loadCoupons(),
    staleTime: 30 * 1000,
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Coupon) => {
      saveCoupon(coupon);
      return coupon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      deleteCoupon(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

// ─── Reviews ───
export function useAdminReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.all,
    queryFn: () => loadReviews(),
    staleTime: 30 * 1000,
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      deleteReview(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}

// ─── Stock ───
export function useAdminStockMovements() {
  return useQuery({
    queryKey: queryKeys.stock.all,
    queryFn: () => loadStockMovements(),
    staleTime: 30 * 1000,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      newStock,
      reason,
    }: {
      productId: string;
      newStock: number;
      reason: string;
    }) => {
      const store = loadStore();
      const product = store.products.find((p) => p.id === productId);
      if (!product) throw new Error("Produto não encontrado");
      const previousStock = product.stock;
      product.stock = Math.max(0, newStock);
      saveStore(store);

      const movement: StockMovement = {
        id: `smv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        productId: product.id,
        productName: product.name,
        type: "adjust",
        quantity: Math.abs(newStock - previousStock),
        previousStock,
        newStock: product.stock,
        reason,
        createdAt: new Date().toISOString(),
      };
      addStockMovement(movement);
      return movement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

// ─── Distributors ───
export function useAdminDistributors() {
  return useQuery({
    queryKey: queryKeys.distributors.all,
    queryFn: () => loadStore().distributors,
    staleTime: 30 * 1000,
  });
}

export function useSaveDistributor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (distributor: Distributor) => {
      const store = loadStore();
      const idx = store.distributors.findIndex((d) => d.id === distributor.id);
      if (idx >= 0) store.distributors[idx] = distributor;
      else store.distributors.push(distributor);
      saveStore(store);
      return distributor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.distributors.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useDeleteDistributor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const store = loadStore();
      store.distributors = store.distributors.filter((d) => d.id !== id);
      saveStore(store);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.distributors.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

export function useToggleDistributor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const store = loadStore();
      const dist = store.distributors.find((d) => d.id === id);
      if (dist) {
        dist.active = !dist.active;
        saveStore(store);
      }
      return dist;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.distributors.all });
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
    },
  });
}

// ─── Combos ───
export function useAdminCombos() {
  return useQuery({
    queryKey: queryKeys.combos.all,
    queryFn: () => getCombos(),
    staleTime: 30 * 1000,
  });
}

export function useSaveCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (combo: Combo) => {
      saveCombo(combo);
      return combo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.combos.all });
    },
  });
}

export function useDeleteCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      deleteCombo(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.combos.all });
    },
  });
}
