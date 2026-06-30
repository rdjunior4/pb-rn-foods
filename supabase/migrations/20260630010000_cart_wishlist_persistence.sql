-- ============================================================
-- Migration: Cart + Wishlist persistence (Supabase)
-- ============================================================

-- ============================================================
-- 1. CART_ITEMS — persistent cart per user
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, variant_id)
);

DROP TRIGGER IF EXISTS cart_items_updated_at ON cart_items;
CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select_own" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_items_insert_own" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_update_own" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_items_delete_own" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);

-- ============================================================
-- 2. WISHLIST_ITEMS — persistent wishlist per user
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_items_select_own" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlist_items_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_items_delete_own" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);

-- ============================================================
-- FIM
-- ============================================================
