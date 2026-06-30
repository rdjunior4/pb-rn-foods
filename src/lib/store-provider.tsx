import { useEffect, useState, type ReactNode } from "react";
import { CartProvider } from "./cart-context";
import { WishlistProvider } from "./wishlist-context";
import { AuthProvider } from "./auth-context";
import { syncFromSupabase } from "./admin-store";
import { syncStoreConfigFromSupabase } from "./store-config";
import { syncPagesFromSupabase } from "./pages-store";
import { Loader2 } from "lucide-react";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    Promise.all([
      syncFromSupabase(),
      syncStoreConfigFromSupabase(),
      syncPagesFromSupabase(),
    ]).then(() => setSynced(true));
  }, []);

  if (!synced) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

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
