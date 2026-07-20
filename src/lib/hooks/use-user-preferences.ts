import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiGetPreferences, apiSavePreferences } from "@/lib/api/user-preferences";
import type { UserPreferences } from "@/lib/types";
import { toast } from "sonner";

export function useUserPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userPreferences.byUser(userId || ""),
    queryFn: () => apiGetPreferences(userId!),
    enabled: !!userId,
  });
}

export function useSaveUserPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, prefs }: { userId: string; prefs: Partial<UserPreferences> }) =>
      apiSavePreferences(userId, prefs),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.userPreferences.byUser(vars.userId) });
      toast.success("Preferencias salvas!");
    },
    onError: () => toast.error("Erro ao salvar preferencias."),
  });
}
