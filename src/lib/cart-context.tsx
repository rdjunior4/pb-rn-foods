import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, type ReactNode } from "react";
import type { CartItem } from "./types";
import { useProducts } from "./hooks";
import { useAuth } from "./auth-context";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { toast } from "sonner";

interface CartState {
  items: CartItem[];
  loaded: boolean;
}

type CartAction =
  | { type: "SET_ITEMS"; items: CartItem[] }
  | { type: "ADD_ITEM"; productId: string; variantId?: string; quantity?: number; unitPrice: number; comboId?: string; comboName?: string; comboDiscountPrice?: number }
  | { type: "REMOVE_ITEM"; productId: string; variantId?: string }
  | { type: "REMOVE_COMBO"; comboId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; variantId?: string; quantity: number }
  | { type: "CLEAR" };

function cartKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_ITEMS":
      return { items: action.items, loaded: true };
    case "ADD_ITEM": {
      const q = action.quantity ?? 1;
      const key = cartKey(action.productId, action.variantId);
      const existing = state.items.find((i) => cartKey(i.productId, i.variantId) === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            cartKey(i.productId, i.variantId) === key ? { ...i, quantity: i.quantity + q, unitPrice: action.unitPrice } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { productId: action.productId, variantId: action.variantId, quantity: q, unitPrice: action.unitPrice, comboId: action.comboId, comboName: action.comboName, comboDiscountPrice: action.comboDiscountPrice }] };
    }
    case "REMOVE_COMBO": {
      return { ...state, items: state.items.filter((i) => i.comboId !== action.comboId) };
    }
    case "REMOVE_ITEM": {
      const key = cartKey(action.productId, action.variantId);
      return { ...state, items: state.items.filter((i) => cartKey(i.productId, i.variantId) !== key) };
    }
    case "UPDATE_QUANTITY": {
      const key = cartKey(action.productId, action.variantId);
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => cartKey(i.productId, i.variantId) !== key) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          cartKey(i.productId, i.variantId) === key ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [], loaded: true };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  loaded: boolean;
  addItem: (productId: string, quantity?: number, variantId?: string, unitPrice?: number, comboId?: string, comboName?: string, comboDiscountPrice?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  removeCombo: (comboId: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string, variantId?: string) => number;
  getComboItems: (comboId: string) => CartItem[];
}

const CartContext = createContext<CartContextType | null>(null);

async function loadCartFromSupabase(userId: string): Promise<CartItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity, unit_price, combo_id, combo_name, combo_discount_price")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    productId: row.product_id as string,
    variantId: (row.variant_id as string) || undefined,
    quantity: Number(row.quantity) || 1,
    unitPrice: Number(row.unit_price) || 0,
    comboId: (row.combo_id as string) || undefined,
    comboName: (row.combo_name as string) || undefined,
    comboDiscountPrice: row.combo_discount_price ? Number(row.combo_discount_price) : undefined,
  }));
}

async function saveCartToSupabase(userId: string, items: CartItem[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("cart_items").delete().eq("user_id", userId);
  if (items.length === 0) return;
  const rows = items.map((item) => ({
    user_id: userId,
    product_id: item.productId,
    variant_id: item.variantId || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    combo_id: item.comboId || null,
    combo_name: item.comboName || null,
    combo_discount_price: item.comboDiscountPrice ?? null,
  }));
  await supabase.from("cart_items").insert(rows);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loaded: false });
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Load cart from Supabase when user logs in
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      dispatch({ type: "SET_ITEMS", items: [] });
      return;
    }
    loadCartFromSupabase(user.id).then((items) => {
      dispatch({ type: "SET_ITEMS", items });
    });
  }, [user]);

  // Save to Supabase whenever cart changes (debounced)
  useEffect(() => {
    if (!user || !isSupabaseConfigured() || !state.loaded) return;
    const timeout = setTimeout(() => {
      saveCartToSupabase(user.id, state.items);
    }, 500);
    return () => clearTimeout(timeout);
  }, [user, state.items, state.loaded]);

  const addItem = useCallback((productId: string, quantity?: number, variantId?: string, unitPrice?: number, comboId?: string, comboName?: string, comboDiscountPrice?: number) => {
    const q = quantity ?? 1;
    const product = productMap.get(productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    let stock = product.stock;
    let price = unitPrice ?? product.price;

    if (variantId && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        stock = variant.stock;
        price = variant.unitPrice;
      }
    }

    if (stock === 0) {
      toast.error("Produto sem estoque");
      return;
    }

    const key = cartKey(productId, variantId);
    const currentQty = state.items.find((i) => cartKey(i.productId, i.variantId) === key)?.quantity ?? 0;
    const newQty = currentQty + q;
    if (newQty > stock) {
      toast.error(`Estoque insuficiente. Disponível: ${stock} un.`);
      if (currentQty < stock) {
        dispatch({ type: "UPDATE_QUANTITY", productId, variantId, quantity: stock });
      }
      return;
    }
    dispatch({ type: "ADD_ITEM", productId, variantId, quantity: q, unitPrice: price, comboId, comboName, comboDiscountPrice });
  }, [state.items, productMap]);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    dispatch({ type: "REMOVE_ITEM", productId, variantId });
  }, []);

  const removeCombo = useCallback((comboId: string) => {
    dispatch({ type: "REMOVE_COMBO", comboId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const product = productMap.get(productId);
    if (product) {
      let stock = product.stock;
      if (variantId && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) stock = variant.stock;
      }
      if (quantity > stock) {
        toast.error(`Estoque insuficiente. Máximo: ${stock} un.`);
        dispatch({ type: "UPDATE_QUANTITY", productId, variantId, quantity: stock });
        return;
      }
    }
    dispatch({ type: "UPDATE_QUANTITY", productId, variantId, quantity });
  }, [productMap]);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const getItemQuantity = useCallback((productId: string, variantId?: string) => {
    const key = cartKey(productId, variantId);
    return state.items.find((i) => cartKey(i.productId, i.variantId) === key)?.quantity ?? 0;
  }, [state.items]);

  const getComboItems = useCallback((comboId: string) => {
    return state.items.filter((i) => i.comboId === comboId);
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, loaded: state.loaded, addItem, removeItem, removeCombo, updateQuantity, clearCart, getItemQuantity, getComboItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
