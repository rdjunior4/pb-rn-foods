import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { useAuth } from "../auth-context";
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
  loadCustomers,
  saveCustomers,
  addLoyaltyPoints,
} from "../admin-store";
import { loadStoreConfig } from "../store-config";
import type { StoreConfig } from "../store-config";
import type { Product, Category, Brand, Order, Coupon, ProductReview, StockMovement, Distributor, Combo, Customer } from "../types";
import { apiDeleteReview } from "../api/reviews";
import {
  apiSaveProduct,
  apiDeleteProduct,
  apiBulkDeleteProducts,
  apiSaveCategory,
  apiDeleteCategory,
  apiSaveBrand,
  apiDeleteBrand,
  apiSaveDistributor,
  apiDeleteDistributor,
  apiSaveCombo,
  apiDeleteCombo,
  apiSaveBanner,
  apiDeleteBanner,
  apiSaveCoupon,
  apiDeleteCoupon,
  apiAddStockMovement,
  apiSaveCustomer,
  apiDeleteCustomer,
  apiAddCredit,
  apiAdjustCredit,
} from "../api/admin-writes";
import { apiUpdateOrderStatus } from "../api/orders";

export function useRequireAdmin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem executar esta ação.");
  }
  return { isAdmin };
}

// ─── Dashboard ───
export function useAdminStore() {
  return useQuery({
    queryKey: queryKeys.admin.store(),
    queryFn: () => loadStore(),
    staleTime: 30 * 1000,
  });
}

export function useStoreConfig() {
  return useQuery({
    queryKey: queryKeys.storeConfig.all,
    queryFn: () => loadStoreConfig(),
    staleTime: 30 * 1000,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.admin.orders(),
    queryFn: () => loadOrders(),
    staleTime: 30 * 1000,
  });
}

// ─── Products ───
export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.admin.products(),
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
      await apiSaveProduct(product);
      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.brands.all });
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
      await apiDeleteProduct(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
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
      await apiBulkDeleteProducts(ids);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ─── Categories ───
export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.admin.categories(),
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
      await apiSaveCategory(category);
      return category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories() });
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
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
      await apiDeleteCategory(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories() });
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
    },
  });
}

// ─── Brands ───
export function useAdminBrands() {
  return useQuery({
    queryKey: queryKeys.admin.brands(),
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
      await apiSaveBrand(brand);
      return brand;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.brands() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
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
      await apiDeleteBrand(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.brands() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
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
      await apiUpdateOrderStatus(orderId, order.status);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
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
      await apiUpdateOrderStatus(orderId, "cancelled");
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
    },
  });
}

// ─── Coupons ───
export function useAdminCoupons() {
  return useQuery({
    queryKey: queryKeys.admin.coupons(),
    queryFn: () => loadCoupons(),
    staleTime: 30 * 1000,
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Coupon) => {
      saveCoupon(coupon);
      await apiSaveCoupon(coupon);
      return coupon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      deleteCoupon(id);
      await apiDeleteCoupon(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
    },
  });
}

// ─── Reviews ───
export function useAdminReviews() {
  return useQuery({
    queryKey: queryKeys.admin.reviews(),
    queryFn: () => loadReviews(),
    staleTime: 30 * 1000,
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDeleteReview(id);
      deleteReview(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reviews() });
    },
  });
}

// ─── Stock ───
export function useAdminStockMovements() {
  return useQuery({
    queryKey: queryKeys.admin.stock(),
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

      await apiSaveProduct(product);

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
      await apiAddStockMovement(movement);
      return movement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.stock() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.products() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
    },
  });
}

// ─── Distributors ───
export function useAdminDistributors() {
  return useQuery({
    queryKey: queryKeys.admin.distributors(),
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
      await apiSaveDistributor(distributor);
      return distributor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.distributors() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
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
      await apiDeleteDistributor(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.distributors() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
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
        await apiSaveDistributor(dist);
      }
      return dist;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.distributors() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.store() });
    },
  });
}

// ─── Combos ───
export function useAdminCombos() {
  return useQuery({
    queryKey: queryKeys.admin.combos(),
    queryFn: () => getCombos(),
    staleTime: 30 * 1000,
  });
}

export function useSaveCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (combo: Combo) => {
      saveCombo(combo);
      await apiSaveCombo(combo);
      return combo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.combos() });
    },
  });
}

export function useDeleteCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      deleteCombo(id);
      await apiDeleteCombo(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.combos() });
    },
  });
}

// ─── Customers (CRM) ───
export function useAdminCustomers() {
  return useQuery({
    queryKey: queryKeys.admin.customers(),
    queryFn: () => loadCustomers(),
    staleTime: 30 * 1000,
  });
}

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      const customers = loadCustomers();
      const idx = customers.findIndex((c) => c.id === customer.id);
      if (idx >= 0) customers[idx] = customer;
      else customers.push(customer);
      saveCustomers(customers);
      await apiSaveCustomer(customer);
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      saveCustomers(loadCustomers().filter((c) => c.id !== id));
      await apiDeleteCustomer(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}

export function useAddCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      amount,
      description,
    }: {
      customerId: string;
      amount: number;
      description: string;
    }) => {
      const customers = loadCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Cliente não encontrado");

      customer.creditBalance += amount;
      customer.creditHistory.push({
        id: `crd_${Date.now()}`,
        type: "release",
        amount,
        description,
        createdAt: new Date().toISOString(),
      });
      saveCustomers(customers);
      await apiAddCredit(customerId, amount, description);
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}

export function useAdjustCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      amount,
      description,
    }: {
      customerId: string;
      amount: number;
      description: string;
    }) => {
      const customers = loadCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Cliente não encontrado");

      customer.creditBalance += amount;
      customer.creditHistory.push({
        id: `crd_${Date.now()}`,
        type: "adjust",
        amount,
        description,
        createdAt: new Date().toISOString(),
      });
      saveCustomers(customers);
      await apiAdjustCredit(customerId, customer.creditBalance, description);
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}

export function useUpdateCustomerTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, tags }: { customerId: string; tags: string[] }) => {
      const customers = loadCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Cliente não encontrado");
      customer.tags = tags;
      saveCustomers(customers);
      const supabase = (await import("../supabase")).getSupabase();
      if (supabase) await supabase.from("customers").update({ tags }).eq("id", customerId);
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}

export function useUpdateCustomerNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, notes }: { customerId: string; notes: string }) => {
      const customers = loadCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Cliente não encontrado");
      customer.notes = notes;
      saveCustomers(customers);
      const supabase = (await import("../supabase")).getSupabase();
      if (supabase) await supabase.from("customers").update({ notes }).eq("id", customerId);
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
    },
  });
}
