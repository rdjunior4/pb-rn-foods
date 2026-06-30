-- ============================================================
-- Migration: Customer schema + orders.items fix + hardening
-- 1. Add orders.items column (fix broken create_order_atomic)
-- 2. Create customers table (CRM: credit, loyalty, tags, notes)
-- 3. Create customer_addresses table (multiple delivery addresses)
-- 4. Create credit_history table (normalized credit ledger)
-- 5. pg_cron cleanup for password_reset_codes
-- 6. CHECK constraints + composite indexes
-- ============================================================

-- ============================================================
-- 1. ORDERS.ITEMS — fix broken create_order_atomic RPC
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'items'
  ) THEN
    ALTER TABLE orders ADD COLUMN items JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 2. CUSTOMERS (CRM)
--    Normalized from localStorage Customer type.
--    Source of truth for credit, loyalty, tags, notes.
--    Linked to profiles via profile_id (nullable for guests).
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  document        TEXT NOT NULL DEFAULT '',
  document_type   document_type NOT NULL DEFAULT 'cpf',
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  state           TEXT NOT NULL DEFAULT '',
  -- Credit
  credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit_limit    NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Loyalty
  loyalty_points  INTEGER NOT NULL DEFAULT 0,
  loyalty_level   TEXT NOT NULL DEFAULT 'bronze'
                  CHECK (loyalty_level IN ('bronze', 'prata', 'ouro')),
  -- CRM
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes           TEXT NOT NULL DEFAULT '',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email),
  UNIQUE (document)
);

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: customer can read own row, admin can read/write all
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own_or_admin" ON customers
  FOR SELECT USING (
    auth.uid() = profile_id OR is_admin()
  );

CREATE POLICY "customers_insert_admin" ON customers
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "customers_update_admin" ON customers
  FOR UPDATE USING (is_admin());

CREATE POLICY "customers_delete_admin" ON customers
  FOR DELETE USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_customers_profile ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document);

-- ============================================================
-- 3. CUSTOMER_ADDRESSES (multiple delivery addresses)
--    One customer can have many addresses (HQ, branch, warehouse)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Casa',
  recipient_name  TEXT NOT NULL DEFAULT '',
  street          TEXT NOT NULL DEFAULT '',
  number          TEXT NOT NULL DEFAULT '',
  complement      TEXT NOT NULL DEFAULT '',
  neighborhood    TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  state           TEXT NOT NULL DEFAULT '',
  cep             TEXT NOT NULL DEFAULT '',
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cust_addr_select_own_or_admin" ON customer_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_addr_insert_admin" ON customer_addresses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "cust_addr_update_admin" ON customer_addresses
  FOR UPDATE USING (is_admin());

CREATE POLICY "cust_addr_delete_admin" ON customer_addresses
  FOR DELETE USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_cust_addr_customer ON customer_addresses(customer_id);

-- ============================================================
-- 4. CREDIT_HISTORY (normalized ledger — one row per movement)
--    Replaces JSONB creditHistory embedded in customers.
--    Immutable: insert-only for audit trail.
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('release', 'adjust', 'block', 'usage')),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  description     TEXT NOT NULL DEFAULT '',
  order_id        TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_history_select_own_or_admin" ON credit_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "credit_history_insert_admin" ON credit_history
  FOR INSERT WITH CHECK (is_admin());

-- No UPDATE or DELETE — immutable audit trail
REVOKE UPDATE ON credit_history FROM anon, authenticated;
REVOKE DELETE ON credit_history FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_credit_history_customer ON credit_history(customer_id, created_at DESC);

-- ============================================================
-- 5. PASSWORD_RESET_CODES cleanup (pg_cron every hour)
-- ============================================================
-- Requires pg_cron extension. If not enabled, this will error
-- gracefully and can be re-run after enabling pg_cron in dashboard.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Drop existing job if re-running
  PERFORM cron.unschedule('cleanup_expired_reset_codes');
  -- Schedule hourly cleanup
  PERFORM cron.schedule(
    'cleanup_expired_reset_codes',
    '0 * * * *',
    'DELETE FROM password_reset_codes WHERE expires_at < NOW() OR used = true;'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available or not enabled: %', SQLERRM;
END $$;

-- ============================================================
-- 6. HARDENING: CHECK constraints + composite indexes
-- ============================================================

-- 6a. products.discount: must be 0-100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'products_discount_range_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_discount_range_check
      CHECK (discount IS NULL OR (discount >= 0 AND discount <= 100));
  END IF;
END $$;

-- 6b. stock_movements.created_by should match auth.uid() on insert
-- (soft enforcement via WITH CHECK on existing policy)
DROP POLICY IF EXISTS "stock_movements_insert_admin" ON stock_movements;
CREATE POLICY "stock_movements_insert_admin" ON stock_movements
  FOR INSERT WITH CHECK (is_admin() AND (created_by = auth.uid() OR created_by IS NULL));

-- 6c. Composite index for coupon per-user validation
CREATE INDEX IF NOT EXISTS idx_orders_customer_coupon
  ON orders(customer_id, coupon_code)
  WHERE coupon_code IS NOT NULL;

-- 6d. Index for guest order lookup by email
CREATE INDEX IF NOT EXISTS idx_orders_guest_email
  ON orders(customer_email)
  WHERE customer_id IS NULL;

-- 6e. Index for credit_history by order (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_credit_history_order
  ON credit_history(order_id)
  WHERE order_id IS NOT NULL;

-- ============================================================
-- 7. REALTIME for new tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_history;

-- ============================================================
-- 8. SYNC: Auto-create customer from order on insert
--    Trigger fires AFTER INSERT on orders — creates/updates
--    customer record automatically from order snapshot data.
-- ============================================================
CREATE OR REPLACE FUNCTION sync_customer_from_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_doc_type document_type := 'cpf';
BEGIN
  -- Skip if no document
  IF COALESCE(NEW.customer_document, '') = '' THEN
    RETURN NEW;
  END IF;

  -- Determine doc type by length (11=CPF, 14=CNPJ)
  v_doc_type := CASE WHEN LENGTH(NEW.customer_document) = 14 THEN 'cnpj' ELSE 'cpf' END;

  -- Try to find existing customer by document
  SELECT id INTO v_customer_id FROM customers WHERE document = NEW.customer_document LIMIT 1;

  IF v_customer_id IS NULL THEN
    -- Try by email
    SELECT id INTO v_customer_id FROM customers WHERE email = LOWER(NEW.customer_email) LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    -- Create new customer from order snapshot
    INSERT INTO customers (name, email, document, document_type, phone, address)
    VALUES (
      NEW.customer_name,
      LOWER(NEW.customer_email),
      NEW.customer_document,
      v_doc_type,
      COALESCE(NEW.customer_phone, ''),
      NEW.shipping_address
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_customer_id;

    -- If still null (conflict on document), fetch it
    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id FROM customers WHERE document = NEW.customer_document LIMIT 1;
    END IF;
  END IF;

  -- Link order to customer if not already linked
  IF v_customer_id IS NOT NULL AND NEW.customer_id IS NULL THEN
    UPDATE orders SET customer_id = v_customer_id WHERE id = NEW.id;
  END IF;

  -- Add loyalty points (R$ 1 = 1 point) — only for delivered orders
  -- (We add on order creation; adjust if cancelled later)
  IF v_customer_id IS NOT NULL THEN
    UPDATE customers SET
      loyalty_points = loyalty_points + FLOOR(NEW.total)
    WHERE id = v_customer_id;

    -- Update loyalty level
    UPDATE customers SET
      loyalty_level = CASE
        WHEN loyalty_points >= 5000 THEN 'ouro'
        WHEN loyalty_points >= 2000 THEN 'prata'
        ELSE 'bronze'
      END
    WHERE id = v_customer_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block order creation due to customer sync failure
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS orders_sync_customer ON orders;
CREATE TRIGGER orders_sync_customer
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION sync_customer_from_order();

-- ============================================================
-- FIM
-- ============================================================