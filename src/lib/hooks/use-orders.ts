import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
  apiLoadOrders,
  apiGetOrderById,
  apiGetOrdersByCustomer,
  apiSaveOrder,
  apiUpdateOrderStatus,
} from "../api/orders";
import type { Order } from "../types";

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: apiLoadOrders,
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => apiGetOrderById(id),
    enabled: !!id,
  });
}

export function useOrdersByCustomer(customerId: string) {
  return useQuery({
    queryKey: queryKeys.orders.byCustomer(customerId),
    queryFn: () => apiGetOrdersByCustomer(customerId),
    enabled: !!customerId,
  });
}

export function useSaveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Order) => apiSaveOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order["status"] }) =>
      apiUpdateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
