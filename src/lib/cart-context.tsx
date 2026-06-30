import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from "react";
import type { CartItem } from "./types";
import { useProducts } from "./hooks";
import { toast } from "sonner";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; productId: string; variantId?: string; quantity?: number; unitPrice: number }
  | { type: "REMOVE_ITEM"; productId: string; variantId?: string }
  | { type: "UPDATE_QUANTITY"; productId: string; variantId?: string; quantity: number }
  | { type: "CLEAR" };

function cartKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const q = action.quantity ?? 1;
      const key = cartKey(action.productId, action.variantId);
      const existing = state.items.find((i) => cartKey(i.productId, i.variantId) === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            cartKey(i.productId, i.variantId) === key ? { ...i, quantity: i.quantity + q, unitPrice: action.unitPrice } : i
          ),
        };
      }
      return { items: [...state.items, { productId: action.productId, variantId: action.variantId, quantity: q, unitPrice: action.unitPrice }] };
    }
    case "REMOVE_ITEM": {
      const key = cartKey(action.productId, action.variantId);
      return { items: state.items.filter((i) => cartKey(i.productId, i.variantId) !== key) };
    }
    case "UPDATE_QUANTITY": {
      const key = cartKey(action.productId, action.variantId);
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => cartKey(i.productId, i.variantId) !== key) };
      }
      return {
        items: state.items.map((i) =>
          cartKey(i.productId, i.variantId) === key ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  addItem: (productId: string, quantity?: number, variantId?: string, unitPrice?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string, variantId?: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { data: products = [] } = useProducts();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const addItem = useCallback((productId: string, quantity?: number, variantId?: string, unitPrice?: number) => {
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
    dispatch({ type: "ADD_ITEM", productId, variantId, quantity: q, unitPrice: price });
  }, [state.items, productMap]);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    dispatch({ type: "REMOVE_ITEM", productId, variantId });
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

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, addItem, removeItem, updateQuantity, clearCart, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}