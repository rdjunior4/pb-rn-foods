import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { getSupabase, isSupabaseConfigured } from "./supabase";

interface WishlistContextType {
  items: string[];
  loaded: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

async function loadWishlistFromSupabase(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => row.product_id as string);
}

async function saveWishlistToSupabase(userId: string, productIds: string[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("wishlist_items").delete().eq("user_id", userId);
  if (productIds.length === 0) return;
  const rows = productIds.map((productId) => ({
    user_id: userId,
    product_id: productId,
  }));
  await supabase.from("wishlist_items").insert(rows);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  // Load wishlist from Supabase when user logs in
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setItems([]);
      setLoaded(true);
      return;
    }
    loadWishlistFromSupabase(user.id).then((ids) => {
      setItems(ids);
      setLoaded(true);
    });
  }, [user]);

  // Save to Supabase whenever wishlist changes (debounced)
  useEffect(() => {
    if (!user || !isSupabaseConfigured() || !loaded) return;
    const timeout = setTimeout(() => {
      saveWishlistToSupabase(user.id, items);
    }, 500);
    return () => clearTimeout(timeout);
  }, [user, items, loaded]);

  const isFavorite = useCallback((productId: string) => items.includes(productId), [items]);

  const toggleFavorite = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  return (
    <WishlistContext.Provider value={{ items, loaded, isFavorite, toggleFavorite }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
