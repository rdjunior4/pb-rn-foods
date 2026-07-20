import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiGetAddresses, apiSaveAddress, apiDeleteAddress, apiSetDefaultAddress } from "@/lib/api/addresses";
import type { CustomerAddress } from "@/lib/types";
import { toast } from "sonner";

export function useCustomerAddresses(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customerAddresses.byCustomer(customerId || ""),
    queryFn: () => apiGetAddresses(customerId!),
    enabled: !!customerId,
  });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (address: Partial<CustomerAddress> & { customerId: string }) => apiSaveAddress(address),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerAddresses.byCustomer(vars.customerId) });
      toast.success("Endereco salvo com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar endereco."),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerId }: { id: string; customerId: string }) => apiDeleteAddress(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerAddresses.byCustomer(vars.customerId) });
      toast.success("Endereco removido.");
    },
    onError: () => toast.error("Erro ao remover endereco."),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, addressId }: { customerId: string; addressId: string }) =>
      apiSetDefaultAddress(customerId, addressId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customerAddresses.byCustomer(vars.customerId) });
    },
  });
}
