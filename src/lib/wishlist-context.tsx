import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface WishlistContextType {
  items: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

function loadWishlist(): string[] {
  try {
    const stored = localStorage.getItem("@pbrn-wishlist");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(loadWishlist);

  useEffect(() => {
    localStorage.setItem("@pbrn-wishlist", JSON.stringify(items));
  }, [items]);

  const isFavorite = useCallback((productId: string) => items.includes(productId), [items]);

  const toggleFavorite = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  return (
    <WishlistContext.Provider value={{ items, isFavorite, toggleFavorite }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
