import { useEffect, type ReactNode } from "react";
import { CartProvider } from "./cart-context";
import { WishlistProvider } from "./wishlist-context";
import { AuthProvider } from "./auth-context";
import { syncFromSupabase } from "./admin-store";
import { loadStoreConfig } from "./store-config";
import { loadPages } from "./pages-store";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncFromSupabase();
    loadStoreConfig();
    loadPages();
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
