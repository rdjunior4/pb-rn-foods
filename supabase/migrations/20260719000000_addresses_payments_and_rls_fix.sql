-- ============================================================
-- Migration: customer_payment_methods + fix RLS addresses
-- 1. Create customer_payment_methods table
-- 2. Fix customer_addresses RLS (allow customer self-service)
-- ============================================================

-- ============================================================
-- 1. CUSTOMER_PAYMENT_METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Cartao principal',
  card_brand      TEXT NOT NULL DEFAULT '',
  card_last4      TEXT NOT NULL DEFAULT '',
  card_holder     TEXT NOT NULL DEFAULT '',
  payment_type    TEXT NOT NULL DEFAULT 'credit'
                  CHECK (payment_type IN ('credit', 'debit', 'pix', 'boleto')),
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS customer_payment_methods_updated_at ON customer_payment_methods;
CREATE TRIGGER customer_payment_methods_updated_at
  BEFORE UPDATE ON customer_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cust_pay_select_own_or_admin" ON customer_payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_pay_insert_own_or_admin" ON customer_payment_methods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_pay_update_own_or_admin" ON customer_payment_methods
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_pay_delete_own_or_admin" ON customer_payment_methods
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE INDEX IF NOT EXISTS idx_cust_pay_customer ON customer_payment_methods(customer_id);

-- ============================================================
-- 2. FIX CUSTOMER_ADDRESSES RLS — allow customer self-service
-- ============================================================
DROP POLICY IF EXISTS "cust_addr_insert_admin" ON customer_addresses;
DROP POLICY IF EXISTS "cust_addr_update_admin" ON customer_addresses;
DROP POLICY IF EXISTS "cust_addr_delete_admin" ON customer_addresses;

CREATE POLICY "cust_addr_insert_own_or_admin" ON customer_addresses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_addr_update_own_or_admin" ON customer_addresses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );

CREATE POLICY "cust_addr_delete_own_or_admin" ON customer_addresses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND (auth.uid() = c.profile_id OR is_admin())
    )
  );
