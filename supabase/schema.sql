-- ============================================================
--  PB&RN FOODS — Schema Supabase (PostgreSQL)
--  Projeto: e-commerce B2B de alimentos
--  Data: 2026-06-24
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 2. ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TYPE coverage_mode AS ENUM ('radius', 'city');

CREATE TYPE discount_type AS ENUM ('percent', 'fixed');

CREATE TYPE coupon_type AS ENUM ('percent', 'fixed', 'freeship');

CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjust');

CREATE TYPE user_role AS ENUM ('admin', 'customer');

CREATE TYPE document_type AS ENUM ('cpf', 'cnpj');

CREATE TYPE section_type AS ENUM (
  'hero',
  'brands',
  'benefits',
  'offer-products',
  'category-products',
  'combos',
  'newsletter',
  'categories-grid',
  'custom-html'
);

CREATE TYPE section_style AS ENUM ('default', 'card', 'highlighted', 'gradient');

CREATE TYPE section_variant AS ENUM ('default', 'alt', 'featured');

-- ============================================================
-- 3. FUNÇÕES UTILITÁRIAS
-- ============================================================

-- Função: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: verificar se usuário é admin (movida para após profiles)
-- Função: gerar slug a partir de texto
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT AS $$
  SELECT lower(regexp_replace(input, '[^a-zA-Z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- Função: gerar ID de pedido (formato PN + timestamp + random)
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
  ts TEXT;
  rand_str TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
BEGIN
  ts := to_char(NOW(), 'YYMMDDHH24MI');
  rand_str := '';
  FOR i IN 1..4 LOOP
    rand_str := rand_str || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN 'PN' || ts || rand_str;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABELAS
-- ============================================================

-- -----------------------------------------------------------
-- 4.1. PROFILES (extende auth.users do Supabase)
-- -----------------------------------------------------------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  document    TEXT NOT NULL DEFAULT '',
  document_type document_type NOT NULL DEFAULT 'cpf',
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: is_admin (depende de profiles)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger: criar profile automaticamente no signup (depende de profiles)
-- SECURITY: role sempre forçado como 'customer' — admin é criado via SQL direto
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT := '';
  v_document TEXT := '';
  v_doc_type document_type := 'cpf';
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    v_document := COALESCE(NEW.raw_user_meta_data->>'document', '');
    v_doc_type := COALESCE(NEW.raw_user_meta_data->>'document_type', 'cpf')::document_type;
    -- SECURITY: Ignorar role do metadata — sempre criar como customer
  END IF;

  INSERT INTO profiles (id, email, name, document, document_type, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_name, v_document, v_doc_type, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------
-- 4.2. CATEGORIES
-- -----------------------------------------------------------
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'Package',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.3. BRANDS
-- -----------------------------------------------------------
CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo        TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.4. PRODUCTS
-- -----------------------------------------------------------
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  details     JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id    UUID REFERENCES brands(id) ON DELETE SET NULL,
  brand_name  TEXT NOT NULL DEFAULT '',
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  old_price   NUMERIC(10,2),
  unit        TEXT NOT NULL DEFAULT 'un',
  image       TEXT NOT NULL DEFAULT '',
  images      JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount    NUMERIC(5,2),
  stock       INTEGER NOT NULL DEFAULT 0,
  featured    BOOLEAN NOT NULL DEFAULT false,
  pricing_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.5. PRODUCT_VARIANTS
-- -----------------------------------------------------------
CREATE TABLE product_variants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  unit_price    NUMERIC(10,2) NOT NULL,
  old_price     NUMERIC(10,2),
  box_price     NUMERIC(10,2),
  box_quantity  INTEGER,
  stock         INTEGER NOT NULL DEFAULT 0,
  sku           TEXT,
  unit          TEXT NOT NULL DEFAULT 'un',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.6. ORDERS
-- -----------------------------------------------------------
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  customer_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_document TEXT NOT NULL DEFAULT '',
  customer_phone  TEXT,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code     TEXT,
  status          order_status NOT NULL DEFAULT 'pending',
  payment_method  TEXT NOT NULL DEFAULT '',
  shipping_address TEXT NOT NULL DEFAULT '',
  shipping_carrier TEXT,
  tracking_code   TEXT,
  estimated_delivery TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  distributor_id  UUID, -- FK adicionada após criação de distributors
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.7. ORDER_ITEMS
-- -----------------------------------------------------------
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  image       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4.8. DISTRIBUTORS
-- -----------------------------------------------------------
CREATE TABLE distributors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  address           TEXT NOT NULL DEFAULT '',
  cep               TEXT NOT NULL DEFAULT '',
  latitude          NUMERIC(10,7) NOT NULL DEFAULT 0,
  longitude         NUMERIC(10,7) NOT NULL DEFAULT 0,
  coverage_mode     coverage_mode NOT NULL DEFAULT 'city',
  coverage_radius_km NUMERIC(8,2) NOT NULL DEFAULT 100,
  coverage_cities   JSONB NOT NULL DEFAULT '[]'::jsonb,
  color             TEXT NOT NULL DEFAULT '#ef4444',
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER distributors_updated_at
  BEFORE UPDATE ON distributors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adiciona FK de orders.distributor_id -> distributors.id (após criação)
ALTER TABLE orders
  ADD CONSTRAINT orders_distributor_id_fkey
  FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE SET NULL;

-- -----------------------------------------------------------
-- 4.9. COMBOS
-- -----------------------------------------------------------
CREATE TABLE combos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  original_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
  combo_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_type   discount_type NOT NULL DEFAULT 'percent',
  discount_value  NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  badge           TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER combos_updated_at
  BEFORE UPDATE ON combos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.10. COMBO_ITEMS
-- -----------------------------------------------------------
CREATE TABLE combo_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combo_id    UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  image       TEXT NOT NULL DEFAULT '',
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4.11. COUPONS
-- -----------------------------------------------------------
CREATE TABLE coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  type            coupon_type NOT NULL DEFAULT 'percent',
  value           NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses        INTEGER NOT NULL DEFAULT 0,
  used_count      INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  per_user_limit  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.12. PRODUCT_REVIEWS
-- -----------------------------------------------------------
CREATE TABLE product_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE TRIGGER product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.13. STOCK_MOVEMENTS
-- -----------------------------------------------------------
CREATE TABLE stock_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  type          stock_movement_type NOT NULL DEFAULT 'adjust',
  quantity      INTEGER NOT NULL DEFAULT 0,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock     INTEGER NOT NULL DEFAULT 0,
  reason        TEXT NOT NULL DEFAULT '',
  order_id      TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4.14. BANNERS
-- -----------------------------------------------------------
CREATE TABLE banners (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL DEFAULT '',
  subtitle      TEXT NOT NULL DEFAULT '',
  image         TEXT NOT NULL DEFAULT '',
  mobile_image  TEXT,
  link          TEXT NOT NULL DEFAULT '',
  cta_text      TEXT NOT NULL DEFAULT '',
  active        BOOLEAN NOT NULL DEFAULT true,
  show_title    BOOLEAN NOT NULL DEFAULT true,
  show_subtitle BOOLEAN NOT NULL DEFAULT true,
  show_cta      BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.15. PAGES (CMS)
-- -----------------------------------------------------------
CREATE TABLE pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  in_footer   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.16. STORE_CONFIG (single-row)
-- -----------------------------------------------------------
CREATE TABLE store_config (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TRIGGER store_config_updated_at
  BEFORE UPDATE ON store_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4.17. NEWSLETTER_SUBSCRIBERS
-- -----------------------------------------------------------
CREATE TABLE newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4.18. PASSWORD_RESET_CODES
-- -----------------------------------------------------------
CREATE TABLE password_reset_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. ÍNDICES
-- ============================================================

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_email ON orders(customer_email);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

CREATE INDEX idx_banners_active ON banners(active, sort_order);

CREATE INDEX idx_combos_active ON combos(active, sort_order);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_footer ON pages(in_footer) WHERE in_footer = true;

CREATE INDEX idx_distributors_active ON distributors(active);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- 6.1. PROFILES
-- -----------------------------------------------------------
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

-- SECURITY: WITH CHECK garante que usuário só pode atualizar seus próprios campos
-- e NUNCA pode alterar o campo 'role' (só admin pode)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.2. CATEGORIES (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_admin" ON categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin" ON categories
  FOR UPDATE USING (is_admin());

CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.3. BRANDS (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "brands_select_public" ON brands
  FOR SELECT USING (true);

CREATE POLICY "brands_insert_admin" ON brands
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "brands_update_admin" ON brands
  FOR UPDATE USING (is_admin());

CREATE POLICY "brands_delete_admin" ON brands
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.4. PRODUCTS (público leitura ativos, admin tudo)
-- -----------------------------------------------------------
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.5. PRODUCT_VARIANTS
-- -----------------------------------------------------------
CREATE POLICY "variants_select_public" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "variants_insert_admin" ON product_variants
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "variants_update_admin" ON product_variants
  FOR UPDATE USING (is_admin());

CREATE POLICY "variants_delete_admin" ON product_variants
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.6. ORDERS (cliente vê seus, admin vê todos)
-- -----------------------------------------------------------
CREATE POLICY "orders_select_own_or_admin" ON orders
  FOR SELECT USING (
    auth.uid() = customer_id
    OR is_admin()
    OR customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "orders_insert_admin_only" ON orders
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.7. ORDER_ITEMS (via join com orders)
-- -----------------------------------------------------------
CREATE POLICY "order_items_select_own_or_admin" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (auth.uid() = o.customer_id OR is_admin())
    )
  );

CREATE POLICY "order_items_insert_admin_only" ON order_items
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "order_items_update_admin" ON order_items
  FOR UPDATE USING (is_admin());

CREATE POLICY "order_items_delete_admin" ON order_items
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.8. DISTRIBUTORS (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "distributors_select_public" ON distributors
  FOR SELECT USING (true);

CREATE POLICY "distributors_insert_admin" ON distributors
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "distributors_update_admin" ON distributors
  FOR UPDATE USING (is_admin());

CREATE POLICY "distributors_delete_admin" ON distributors
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.9. COMBOS (público leitura ativos, admin tudo)
-- -----------------------------------------------------------
CREATE POLICY "combos_select_public" ON combos
  FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "combos_insert_admin" ON combos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "combos_update_admin" ON combos
  FOR UPDATE USING (is_admin());

CREATE POLICY "combos_delete_admin" ON combos
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.10. COMBO_ITEMS
-- -----------------------------------------------------------
CREATE POLICY "combo_items_select_public" ON combo_items
  FOR SELECT USING (true);

CREATE POLICY "combo_items_insert_admin" ON combo_items
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "combo_items_update_admin" ON combo_items
  FOR UPDATE USING (is_admin());

CREATE POLICY "combo_items_delete_admin" ON combo_items
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.11. COUPONS (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "coupons_select_public" ON coupons
  FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "coupons_insert_admin" ON coupons
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "coupons_update_admin" ON coupons
  FOR UPDATE USING (is_admin());

CREATE POLICY "coupons_delete_admin" ON coupons
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.12. PRODUCT_REVIEWS (público leitura, logado cria)
-- -----------------------------------------------------------
CREATE POLICY "reviews_select_public" ON product_reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_authenticated" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own_or_admin" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "reviews_delete_own_or_admin" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- -----------------------------------------------------------
-- 6.13. STOCK_MOVEMENTS (admin only)
-- -----------------------------------------------------------
CREATE POLICY "stock_movements_select_admin" ON stock_movements
  FOR SELECT USING (is_admin());

CREATE POLICY "stock_movements_insert_admin" ON stock_movements
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "stock_movements_delete_admin" ON stock_movements
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.14. BANNERS (público leitura ativos, admin tudo)
-- -----------------------------------------------------------
CREATE POLICY "banners_select_public" ON banners
  FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "banners_insert_admin" ON banners
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "banners_update_admin" ON banners
  FOR UPDATE USING (is_admin());

CREATE POLICY "banners_delete_admin" ON banners
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.15. PAGES (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "pages_select_public" ON pages
  FOR SELECT USING (true);

CREATE POLICY "pages_insert_admin" ON pages
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "pages_update_admin" ON pages
  FOR UPDATE USING (is_admin());

CREATE POLICY "pages_delete_admin" ON pages
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.16. STORE_CONFIG (público leitura, admin escrita)
-- -----------------------------------------------------------
CREATE POLICY "store_config_select_public" ON store_config
  FOR SELECT USING (true);

CREATE POLICY "store_config_update_admin" ON store_config
  FOR UPDATE USING (is_admin());

CREATE POLICY "store_config_insert_admin" ON store_config
  FOR INSERT WITH CHECK (is_admin());

-- -----------------------------------------------------------
-- 6.17. NEWSLETTER_SUBSCRIBERS (qualquer um inscreve, admin lê)
-- -----------------------------------------------------------
CREATE POLICY "newsletter_insert_public" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "newsletter_select_admin" ON newsletter_subscribers
  FOR SELECT USING (is_admin());

CREATE POLICY "newsletter_delete_admin" ON newsletter_subscribers
  FOR DELETE USING (is_admin());

-- -----------------------------------------------------------
-- 6.18. PASSWORD_RESET_CODES
-- SECURITY: Apenas service_role (Edge Functions) podem acessar
-- -----------------------------------------------------------
CREATE POLICY "reset_codes_select_service" ON password_reset_codes
  FOR SELECT USING (false);

CREATE POLICY "reset_codes_insert_service" ON password_reset_codes
  FOR INSERT WITH CHECK (false);

CREATE POLICY "reset_codes_update_service" ON password_reset_codes
  FOR UPDATE USING (false);

CREATE POLICY "reset_codes_delete_service" ON password_reset_codes
  FOR DELETE USING (is_admin());

-- ============================================================
-- 7. FUNÇÕES RPC (chamadas via Supabase client)
-- ============================================================

-- -----------------------------------------------------------
-- 7.1. Decrementar estoque ao finalizar pedido
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_stock_for_order(
  p_order_id TEXT,
  p_items JSONB
)
RETURNS VOID AS $$
DECLARE
  item JSONB;
  v_product UUID;
  v_variant UUID;
  v_qty INTEGER;
  v_prev_stock INTEGER;
  v_product_name TEXT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product := (item->>'productId')::UUID;
    v_variant := NULLIF(item->>'variantId', '')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    -- Decrementar variante
    IF v_variant IS NOT NULL THEN
      SELECT stock INTO v_prev_stock FROM product_variants WHERE id = v_variant;
      IF v_prev_stock IS NOT NULL THEN
        UPDATE product_variants
        SET stock = GREATEST(0, stock - v_qty)
        WHERE id = v_variant;

        SELECT name INTO v_product_name FROM products WHERE id = v_product;
        INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
        VALUES (v_product, COALESCE(v_product_name, ''), 'out', v_qty, v_prev_stock, GREATEST(0, v_prev_stock - v_qty),
                'Venda — pedido ' || p_order_id, p_order_id);
      END IF;
    END IF;

    -- Decrementar produto principal
    SELECT stock, name INTO v_prev_stock, v_product_name FROM products WHERE id = v_product;
    IF v_prev_stock IS NOT NULL THEN
      UPDATE products
      SET stock = GREATEST(0, stock - v_qty)
      WHERE id = v_product;

      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
      VALUES (v_product, COALESCE(v_product_name, ''), 'out', v_qty, v_prev_stock, GREATEST(0, v_prev_stock - v_qty),
              'Venda — pedido ' || p_order_id, p_order_id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------
-- 7.1b. Criar pedido atomicamente (tudo em uma transação)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order JSONB,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_coupon_id UUID DEFAULT NULL
)
RETURNS TABLE(order_id TEXT, ok BOOLEAN, error TEXT) AS $$
DECLARE
  v_order_id TEXT;
  v_order JSONB;
  v_coupon_valid BOOLEAN;
  v_coupon_error TEXT;
BEGIN
  v_order_id := p_order->>'id';

  -- 0. Validar identidade: usuario autenticado so pode criar pedido para si mesmo
  IF auth.uid() IS NOT NULL AND (p_order->>'customerId') IS NOT NULL THEN
    IF auth.uid() <> (p_order->>'customerId')::UUID THEN
      RETURN QUERY SELECT v_order_id, FALSE, 'Acesso negado: voce so pode criar pedidos para sua propria conta'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 1. Validar cupom se fornecido
  IF p_coupon_id IS NOT NULL AND p_coupon_code IS NOT NULL THEN
    SELECT v.ok, v.error INTO v_coupon_valid, v_coupon_error
    FROM validate_coupon(p_coupon_code, (p_order->>'subtotal')::NUMERIC) v;

    IF NOT v_coupon_valid THEN
      RETURN QUERY SELECT v_order_id, FALSE, COALESCE(v_coupon_error, 'Cupom inválido');
      RETURN;
    END IF;

    PERFORM increment_coupon_usage(p_coupon_id);
  END IF;

  -- 2. Inserir pedido
  INSERT INTO orders (
    id, customer_id, customer_name, customer_email, customer_document,
    customer_phone, items, subtotal, discount, shipping_cost, total,
    coupon_code, status, payment_method, shipping_address,
    latitude, longitude, distributor_id, created_at, updated_at
  ) VALUES (
    v_order_id,
    (p_order->>'customerId')::UUID,
    p_order->>'customerName',
    p_order->>'customerEmail',
    p_order->>'customerDocument',
    p_order->>'customerPhone',
    p_items,
    (p_order->>'subtotal')::NUMERIC,
    COALESCE((p_order->>'discount')::NUMERIC, 0),
    COALESCE((p_order->>'shippingCost')::NUMERIC, 0),
    (p_order->>'total')::NUMERIC,
    p_coupon_code,
    'pending',
    p_order->>'paymentMethod',
    p_order->>'shippingAddress',
    NULLIF((p_order->>'latitude')::TEXT, '')::NUMERIC,
    NULLIF((p_order->>'longitude')::TEXT, '')::NUMERIC,
    NULLIF((p_order->>'distributorId')::TEXT, '')::UUID,
    NOW(),
    NOW()
  );

  -- 3. Inserir itens do pedido
  INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, price, image)
  SELECT
    v_order_id,
    (item->>'productId')::UUID,
    NULLIF(item->>'variantId', '')::UUID,
    item->>'productName',
    (item->>'quantity')::INTEGER,
    (item->>'price')::NUMERIC,
    item->>'image'
  FROM jsonb_array_elements(p_items) AS item;

  -- 4. Decrementar estoque
  PERFORM decrement_stock_for_order(v_order_id, p_items);

  RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_order_value NUMERIC,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  ok BOOLEAN,
  error TEXT,
  coupon_id UUID,
  coupon_type coupon_type,
  coupon_value NUMERIC,
  coupon_code TEXT
) AS $$
DECLARE
  c RECORD;
  user_uses INTEGER := 0;
BEGIN
  SELECT * INTO c FROM coupons WHERE code = UPPER(p_code) AND active = true FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupom inválido ou inativo.'::TEXT, NULL::UUID, NULL::coupon_type, NULL::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Cupom expirado.'::TEXT, NULL::UUID, NULL::coupon_type, NULL::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF c.max_uses > 0 AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, 'Cupom esgotado.'::TEXT, NULL::UUID, NULL::coupon_type, NULL::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF p_order_value < c.min_order_value THEN
    RETURN QUERY SELECT false, ('Valor mínimo do pedido: R$ ' || c.min_order_value)::TEXT, NULL::UUID, NULL::coupon_type, NULL::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF c.per_user_limit > 0 AND p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO user_uses FROM orders WHERE customer_id = p_user_id AND coupon_code = c.code;
    IF user_uses >= c.per_user_limit THEN
      RETURN QUERY SELECT false, 'Limite de uso por cliente atingido.'::TEXT, NULL::UUID, NULL::coupon_type, NULL::NUMERIC, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, c.id, c.type, c.value, c.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------
-- 7.3. Incrementar uso de cupom
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------
-- 7.4. Solicitar reset de senha
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION request_password_reset(p_email TEXT)
RETURNS TABLE(ok BOOLEAN, error TEXT) AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = LOWER(p_email)) INTO v_exists;
  IF NOT v_exists THEN
    RETURN QUERY SELECT false, 'E-mail não cadastrado.'::TEXT;
    RETURN;
  END IF;

  v_code := lpad(floor(random() * 1000000)::TEXT, 6, '0');

  DELETE FROM password_reset_codes WHERE email = LOWER(p_email);
  INSERT INTO password_reset_codes (email, code) VALUES (LOWER(p_email), v_code);

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. REALTIME (habilitar para tabelas críticas)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE product_reviews;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
