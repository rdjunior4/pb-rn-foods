import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "../supabase";
import { queryKeys } from "../query-keys";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useOrderRealtime(orderId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let channel: RealtimeChannel;

    if (orderId) {
      channel = supabase
        .channel(`order-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.orders.detail(orderId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.orders.all,
            });
          },
        )
        .subscribe();
    } else {
      channel = supabase
        .channel("orders-all")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.orders.all,
            });
          },
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orderId, queryClient]);
}

export function useOrdersRealtime() {
  useOrderRealtime();
}
