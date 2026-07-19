-- ============================================================
-- Migration: product_categories junction table (many-to-many)
-- Allows a product to belong to multiple categories.
-- Keeps legacy category_id on products for backward compat.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_categories (
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Public can read (storefront needs to browse by category)
CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT USING (true);

-- Admin can insert/delete
CREATE POLICY "product_categories_insert_admin" ON product_categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "product_categories_delete_admin" ON product_categories
  FOR DELETE USING (is_admin());

-- Index for reverse lookup (category -> products)
CREATE INDEX IF NOT EXISTS idx_product_categories_category
  ON product_categories(category_id);

-- Migrate existing category_id data into the junction table
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;