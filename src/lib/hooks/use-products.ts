import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
  apiGetProducts,
  apiGetProductBySlug,
  apiGetProductById,
  apiGetProductsByCategory,
  apiGetFeaturedProducts,
  apiSearchProducts,
  apiGetCategories,
  apiGetBrands,
} from "../api/products";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: apiGetProducts,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => apiGetProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: queryKeys.products.byId(id),
    queryFn: () => apiGetProductById(id),
    enabled: !!id,
  });
}

export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId),
    queryFn: () => apiGetProductsByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: apiGetFeaturedProducts,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => apiSearchProducts(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: apiGetCategories,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: apiGetBrands,
  });
}
