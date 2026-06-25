import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { apiGetCombos } from "../api/combos";
import { apiGetReviewsByProduct, apiAddReview, apiDeleteReview } from "../api/reviews";
import { apiValidateCoupon } from "../api/coupons";
import type { ProductReview } from "../types";

export function useCombos() {
  return useQuery({
    queryKey: queryKeys.combos.all,
    queryFn: apiGetCombos,
  });
}

export function useReviewsByProduct(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byProduct(productId),
    queryFn: () => apiGetReviewsByProduct(productId),
    enabled: !!productId,
  });
}

export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: ProductReview) => apiAddReview(review),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byProduct(variables.productId),
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDeleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({
      code,
      orderValue,
      userId,
    }: {
      code: string;
      orderValue: number;
      userId?: string;
    }) => apiValidateCoupon(code, orderValue, userId),
  });
}
