import { useEffect, type ReactNode } from "react";
import { CartProvider } from "./cart-context";
import { WishlistProvider } from "./wishlist-context";
import { AuthProvider } from "./auth-context";
import { syncFromSupabase } from "./admin-store";
import { syncStoreConfigFromSupabase } from "./store-config";
import { syncPagesFromSupabase } from "./pages-store";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncFromSupabase();
    syncStoreConfigFromSupabase();
    syncPagesFromSupabase();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
