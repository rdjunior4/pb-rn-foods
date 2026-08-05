-- ============================================================
-- PB&RN FOODS — Migração: Fluxo de Pedido Seguro e Escalável
-- Data: 2026-08-05 (v2 - idempotente)
-- ============================================================

-- 1. ATUALIZAR ENUM DE STATUS
DO $$
BEGIN
  -- Criar novo tipo se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_new') THEN
    CREATE TYPE order_status_new AS ENUM (
      'pending', 'paid', 'preparing', 'ready', 'shipped',
      'in_transit', 'delivered', 'completed', 'cancelled', 'refunded'
    );
  END IF;
END $$;

-- Converter coluna para novo enum (só se o tipo ainda for o antigo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'status'
    AND udt_name = 'order_status'
  ) THEN
    ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE orders ALTER COLUMN status TYPE order_status_new USING status::text::order_status_new;
    ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
    DROP TYPE order_status CASCADE;
    ALTER TYPE order_status_new RENAME TO order_status;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Se já foi convertido, apenas renomear
  BEGIN
    ALTER TYPE order_status_new RENAME TO order_status;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 2. TABELA PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'asaas',
  provider_id       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  amount            NUMERIC(10,2) NOT NULL,
  payment_method    TEXT NOT NULL,
  transaction_id    TEXT,
  pix_qr_code       TEXT,
  pix_copy_paste    TEXT,
  boleto_url        TEXT,
  boleto_barcode    TEXT,
  card_last_digits  TEXT,
  card_brand        TEXT,
  installments      INTEGER NOT NULL DEFAULT 1,
  installment_value NUMERIC(10,2),
  paid_at           TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_id);

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. TABELA ORDER_HISTORY
CREATE TABLE IF NOT EXISTS order_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status      order_status,
  new_status      order_status NOT NULL,
  changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_by_role TEXT,
  action          TEXT NOT NULL DEFAULT 'other',
  notes           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_history(created_at DESC);

-- 4. TABELA ORDER_NOTES
CREATE TABLE IF NOT EXISTS order_notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name   TEXT NOT NULL,
  author_role   TEXT NOT NULL,
  content       TEXT NOT NULL,
  is_internal   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created ON order_notes(created_at DESC);

-- 5. TABELA STOCK_RESERVATIONS
CREATE TABLE IF NOT EXISTS stock_reservations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order ON stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expires ON stock_reservations(expires_at) WHERE status = 'active';

-- 6. FUNÇÕES RPC

CREATE OR REPLACE FUNCTION reserve_stock_for_order(p_order_id TEXT, p_items JSONB)
RETURNS TABLE(ok BOOLEAN, error TEXT) AS $$
DECLARE
  item JSONB;
  v_product UUID;
  v_variant UUID;
  v_qty INTEGER;
  v_available INTEGER;
  v_product_name TEXT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product := (item->>'productId')::UUID;
    v_variant := NULLIF(item->>'variantId', '')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    IF v_variant IS NOT NULL THEN
      SELECT stock INTO v_available FROM product_variants WHERE id = v_variant;
      v_available := v_available - COALESCE(
        (SELECT SUM(quantity) FROM stock_reservations WHERE variant_id = v_variant AND status = 'active'), 0
      );
      IF v_available < v_qty THEN
        SELECT name INTO v_product_name FROM products WHERE id = v_product;
        RETURN QUERY SELECT FALSE, ('Estoque insuficiente: ' || COALESCE(v_product_name, 'produto'))::TEXT;
        RETURN;
      END IF;
    ELSE
      SELECT stock INTO v_available FROM products WHERE id = v_product;
      v_available := v_available - COALESCE(
        (SELECT SUM(quantity) FROM stock_reservations WHERE product_id = v_product AND variant_id IS NULL AND status = 'active'), 0
      );
      IF v_available < v_qty THEN
        SELECT name INTO v_product_name FROM products WHERE id = v_product;
        RETURN QUERY SELECT FALSE, ('Estoque insuficiente: ' || COALESCE(v_product_name, 'produto'))::TEXT;
        RETURN;
      END IF;
    END IF;

    INSERT INTO stock_reservations (order_id, product_id, variant_id, quantity)
    VALUES (p_order_id, v_product, v_variant, v_qty);
  END LOOP;

  INSERT INTO order_history (order_id, new_status, changed_by_role, action, notes)
  VALUES (p_order_id, 'pending', 'system', 'stock_reserved', 'Estoque reservado por 30 minutos');

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_stock_reservation(p_order_id TEXT)
RETURNS VOID AS $$
DECLARE v_reservation RECORD;
BEGIN
  FOR v_reservation IN SELECT * FROM stock_reservations WHERE order_id = p_order_id AND status = 'active' LOOP
    IF v_reservation.variant_id IS NOT NULL THEN
      UPDATE product_variants SET stock = GREATEST(0, stock - v_reservation.quantity) WHERE id = v_reservation.variant_id;
    ELSE
      UPDATE products SET stock = GREATEST(0, stock - v_reservation.quantity) WHERE id = v_reservation.product_id;
    END IF;
    UPDATE stock_reservations SET status = 'confirmed' WHERE id = v_reservation.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION release_stock_reservation(p_order_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE stock_reservations SET status = 'cancelled' WHERE order_id = p_order_id AND status = 'active';
  INSERT INTO order_history (order_id, new_status, changed_by_role, action, notes)
  VALUES (p_order_id, 'cancelled', 'system', 'stock_released', 'Reserva de estoque liberada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE stock_reservations SET status = 'cancelled' WHERE status = 'active' AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_order_note(
  p_order_id TEXT, p_author_id UUID, p_author_name TEXT,
  p_author_role TEXT, p_content TEXT, p_is_internal BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE v_note_id UUID;
BEGIN
  INSERT INTO order_history (order_id, new_status, changed_by, changed_by_name, changed_by_role, action, notes)
  SELECT p_order_id, o.status, p_author_id, p_author_name, p_author_role, 'note_added', p_content
  FROM orders o WHERE o.id = p_order_id;

  INSERT INTO order_notes (order_id, author_id, author_name, author_role, content, is_internal)
  VALUES (p_order_id, p_author_id, p_author_name, p_author_role, p_content, p_is_internal)
  RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_order_status_with_history(
  p_order_id TEXT, p_new_status order_status, p_changed_by UUID,
  p_changed_by_name TEXT, p_changed_by_role TEXT, p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE v_old_status order_status;
BEGIN
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE orders SET status = p_new_status, updated_at = NOW() WHERE id = p_order_id;

  INSERT INTO order_history (order_id, old_status, new_status, changed_by, changed_by_name, changed_by_role, action, notes)
  VALUES (p_order_id, v_old_status, p_new_status, p_changed_by, p_changed_by_name, p_changed_by_role, 'status_change', p_notes);

  IF p_new_status = 'cancelled' THEN PERFORM release_stock_reservation(p_order_id); END IF;
  IF p_new_status = 'paid' THEN PERFORM confirm_stock_reservation(p_order_id); END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
  CREATE POLICY "payments_select_own_or_admin" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (auth.uid() = o.customer_id OR is_admin()))
  );
  DROP POLICY IF EXISTS "payments_insert_admin" ON payments;
  CREATE POLICY "payments_insert_admin" ON payments FOR INSERT WITH CHECK (is_admin());
  DROP POLICY IF EXISTS "payments_update_admin" ON payments;
  CREATE POLICY "payments_update_admin" ON payments FOR UPDATE USING (is_admin());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "order_history_select_own_or_admin" ON order_history;
  CREATE POLICY "order_history_select_own_or_admin" ON order_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (auth.uid() = o.customer_id OR is_admin()))
  );
  DROP POLICY IF EXISTS "order_history_insert_admin" ON order_history;
  CREATE POLICY "order_history_insert_admin" ON order_history FOR INSERT WITH CHECK (is_admin());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "order_notes_select_own_or_admin" ON order_notes;
  CREATE POLICY "order_notes_select_own_or_admin" ON order_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (auth.uid() = o.customer_id OR is_admin()))
  );
  DROP POLICY IF EXISTS "order_notes_insert_authenticated" ON order_notes;
  CREATE POLICY "order_notes_insert_authenticated" ON order_notes FOR INSERT WITH CHECK (auth.uid() = author_id OR is_admin());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "stock_reservations_select_admin" ON stock_reservations;
  CREATE POLICY "stock_reservations_select_admin" ON stock_reservations FOR SELECT USING (is_admin());
  DROP POLICY IF EXISTS "stock_reservations_insert_admin" ON stock_reservations;
  CREATE POLICY "stock_reservations_insert_admin" ON stock_reservations FOR INSERT WITH CHECK (is_admin());
  DROP POLICY IF EXISTS "stock_reservations_update_admin" ON stock_reservations;
  CREATE POLICY "stock_reservations_update_admin" ON stock_reservations FOR UPDATE USING (is_admin());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. REALTIME
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE payments;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_history;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_notes;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
