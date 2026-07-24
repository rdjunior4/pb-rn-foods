-- ============================================================
-- Migration: Add combo fields to cart_items
-- ============================================================

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS combo_id TEXT;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS combo_name TEXT;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS combo_discount_price NUMERIC(12,2);

-- ============================================================
-- FIM
-- ============================================================
