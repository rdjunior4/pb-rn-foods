import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiGetPaymentMethods, apiSavePaymentMethod, apiDeletePaymentMethod, apiSetDefaultPayment } from "@/lib/api/payment-methods";
import type { SavedPaymentMethod } from "@/lib/types";
import { toast } from "sonner";

export function useCustomerPayments(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customerPayments.byCustomer(customerId || ""),
    queryFn: () => apiGetPaymentMethods(customerId!),
    enabled: !!customerId,
  });
}

export function useSavePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (method: Partial<SavedPaymentMethod> & { customerId: string }) => apiSavePaymentMethod(method),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerPayments.byCustomer(vars.customerId) });
      toast.success("Forma de pagamento salva!");
    },
    onError: () => toast.error("Erro ao salvar forma de pagamento."),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerId }: { id: string; customerId: string }) => apiDeletePaymentMethod(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerPayments.byCustomer(vars.customerId) });
      toast.success("Forma de pagamento removida.");
    },
    onError: () => toast.error("Erro ao remover forma de pagamento."),
  });
}

export function useSetDefaultPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, methodId }: { customerId: string; methodId: string }) =>
      apiSetDefaultPayment(customerId, methodId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerPayments.byCustomer(vars.customerId) });
    },
  });
}
