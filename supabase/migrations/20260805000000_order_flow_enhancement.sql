-- ============================================================
-- PB&RN FOODS — Migração: Fluxo de Pedido Seguro e Escalável
-- Data: 2026-08-05
-- Descrição: Adiciona tabelas payments, order_history, order_notes,
--            stock_reservations e expande status do pedido
-- ============================================================

-- ============================================================
-- 1. ATUALIZAR ENUM DE STATUS (adicionar novos statuses)
-- ============================================================

-- Criar novo enum com todos os statuses
CREATE TYPE order_status_v2 AS ENUM (
  'pending',      -- Aguardando pagamento
  'paid',         -- Pagamento confirmado
  'preparing',    -- Separando itens
  'ready',        -- Pronto para envio
  'shipped',      -- Saiu para entrega
  'in_transit',   -- Em trânsito
  'delivered',    -- Entregue
  'completed',    -- Cliente confirmou recebimento
  'cancelled',    -- Cancelado
  'refunded'      -- Estornado
);

-- Atualizar coluna status para usar novo enum
ALTER TABLE orders 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status_v2 USING status::text::order_status_v2,
  ALTER COLUMN status SET DEFAULT 'pending';

-- Remover enum antigo
DROP TYPE IF EXISTS order_status;

-- Renomear novo enum
ALTER TYPE order_status_v2 RENAME TO order_status;

-- ============================================================
-- 2. TABELA PAYMENTS (rastreio de pagamentos)
-- ============================================================

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'asaas',
  provider_id       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'failed', 'refunded')),
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('pix', 'boleto', 'credit_card', 'debit_card', 'cash')),
  transaction_id    TEXT,
  pix_qr_code       TEXT,
  pix_copy_paste    TEXT,
  boleto_url        TEXT,
  boleto_barcode    TEXT,
  card_last_digits  TEXT,
  card_brand        TEXT,
  installments      INTEGER NOT NULL DEFAULT 1 CHECK (installments >= 1),
  installment_value NUMERIC(10,2),
  paid_at           TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_id ON payments(provider_id);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. TABELA ORDER_HISTORY (auditoria de mudanças)
-- ============================================================

CREATE TABLE order_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status      order_status,
  new_status      order_status NOT NULL,
  changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_by_role TEXT CHECK (changed_by_role IN ('customer', 'admin', 'system')),
  action          TEXT NOT NULL CHECK (action IN ('status_change', 'payment_update', 'note_added', 'stock_reserved', 'stock_released', 'other')),
  notes           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON order_history(order_id);
CREATE INDEX idx_order_history_created ON order_history(created_at DESC);

-- ============================================================
-- 4. TABELA ORDER_NOTES (comunicação cliente/admin)
-- ============================================================

CREATE TABLE order_notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name   TEXT NOT NULL,
  author_role   TEXT NOT NULL CHECK (author_role IN ('customer', 'admin', 'system')),
  content       TEXT NOT NULL CHECK (length(content) > 0),
  is_internal   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_notes_order ON order_notes(order_id);
CREATE INDEX idx_order_notes_created ON order_notes(created_at DESC);

-- ============================================================
-- 5. TABELA STOCK_RESERVATIONS (reserva de estoque)
-- ============================================================

CREATE TABLE stock_reservations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_reservations_order ON stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_product ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_expires ON stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_stock_reservations_status ON stock_reservations(status);

-- ============================================================
-- 6. FUNÇÕES RPC
-- ============================================================

-- Função: Reservar estoque para um pedido
CREATE OR REPLACE FUNCTION reserve_stock_for_order(
  p_order_id TEXT,
  p_items JSONB
)
RETURNS TABLE(ok BOOLEAN, error TEXT) AS $$
DECLARE
  item JSONB;
  v_product UUID;
  v_variant UUID;
  v_qty INTEGER;
  v_available INTEGER;
  v_product_name TEXT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product := (item->>'productId')::UUID;
    v_variant := NULLIF(item->>'variantId', '')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    -- Verificar estoque disponível (estoque - reservas ativas)
    IF v_variant IS NOT NULL THEN
      SELECT stock INTO v_available 
      FROM product_variants 
      WHERE id = v_variant;
      
      -- Descontar reservas ativas
      v_available := v_available - COALESCE(
        (SELECT SUM(quantity) FROM stock_reservations 
         WHERE variant_id = v_variant AND status = 'active'), 
        0
      );
      
      IF v_available < v_qty THEN
        SELECT name INTO v_product_name FROM products WHERE id = v_product;
        RETURN QUERY SELECT FALSE, 
          ('Estoque insuficiente para: ' || COALESCE(v_product_name, 'produto'))::TEXT;
        RETURN;
      END IF;
    ELSE
      SELECT stock INTO v_available 
      FROM products 
      WHERE id = v_product;
      
      -- Descontar reservas ativas
      v_available := v_available - COALESCE(
        (SELECT SUM(quantity) FROM stock_reservations 
         WHERE product_id = v_product AND variant_id IS NULL AND status = 'active'), 
        0
      );
      
      IF v_available < v_qty THEN
        SELECT name INTO v_product_name FROM products WHERE id = v_product;
        RETURN QUERY SELECT FALSE, 
          ('Estoque insuficiente para: ' || COALESCE(v_product_name, 'produto'))::TEXT;
        RETURN;
      END IF;
    END IF;

    -- Criar reserva
    INSERT INTO stock_reservations (order_id, product_id, variant_id, quantity)
    VALUES (p_order_id, v_product, v_variant, v_qty);
  END LOOP;

  -- Registrar no histórico
  INSERT INTO order_history (order_id, new_status, changed_by_role, action, notes)
  VALUES (p_order_id, 'pending', 'system', 'stock_reserved', 'Estoque reservado por 30 minutos');

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Confirmar reserva (após pagamento)
CREATE OR REPLACE FUNCTION confirm_stock_reservation(
  p_order_id TEXT
)
RETURNS VOID AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- Confirmar todas as reservas do pedido
  FOR v_reservation IN 
    SELECT * FROM stock_reservations 
    WHERE order_id = p_order_id AND status = 'active'
  LOOP
    -- Decrementar estoque
    IF v_reservation.variant_id IS NOT NULL THEN
      UPDATE product_variants 
      SET stock = GREATEST(0, stock - v_reservation.quantity)
      WHERE id = v_reservation.variant_id;
      
      -- Registrar movimentação
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
      SELECT 
        v_reservation.product_id,
        p.name,
        'out',
        v_reservation.quantity,
        p.stock + v_reservation.quantity,
        p.stock,
        'Venda confirmada — pedido ' || p_order_id,
        p_order_id
      FROM products p WHERE p.id = v_reservation.product_id;
    ELSE
      UPDATE products 
      SET stock = GREATEST(0, stock - v_reservation.quantity)
      WHERE id = v_reservation.product_id;
      
      -- Registrar movimentação
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
      SELECT 
        v_reservation.product_id,
        p.name,
        'out',
        v_reservation.quantity,
        p.stock + v_reservation.quantity,
        p.stock,
        'Venda confirmada — pedido ' || p_order_id,
        p_order_id
      FROM products p WHERE p.id = v_reservation.product_id;
    END IF;

    -- Atualizar status da reserva
    UPDATE stock_reservations 
    SET status = 'confirmed' 
    WHERE id = v_reservation.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Liberar reserva (cancelamento ou expiração)
CREATE OR REPLACE FUNCTION release_stock_reservation(
  p_order_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE stock_reservations 
  SET status = 'cancelled'
  WHERE order_id = p_order_id AND status = 'active';
  
  -- Registrar no histórico
  INSERT INTO order_history (order_id, new_status, changed_by_role, action, notes)
  VALUES (p_order_id, 'cancelled', 'system', 'stock_released', 'Reserva de estoque liberada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Limpar reservas expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE stock_reservations 
  SET status = 'cancelled'
  WHERE status = 'active' AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Adicionar nota ao pedido
CREATE OR REPLACE FUNCTION add_order_note(
  p_order_id TEXT,
  p_author_id UUID,
  p_author_name TEXT,
  p_author_role TEXT,
  p_content TEXT,
  p_is_internal BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_note_id UUID;
BEGIN
  INSERT INTO order_history (order_id, new_status, changed_by, changed_by_name, changed_by_role, action, notes)
  SELECT 
    p_order_id,
    o.status,
    p_author_id,
    p_author_name,
    p_author_role,
    'note_added',
    p_content
  FROM orders o WHERE o.id = p_order_id;

  INSERT INTO order_notes (order_id, author_id, author_name, author_role, content, is_internal)
  VALUES (p_order_id, p_author_id, p_author_name, p_author_role, p_content, p_is_internal)
  RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Atualizar status do pedido com histórico
CREATE OR REPLACE FUNCTION update_order_status_with_history(
  p_order_id TEXT,
  p_new_status order_status,
  p_changed_by UUID,
  p_changed_by_name TEXT,
  p_changed_by_role TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_status order_status;
BEGIN
  -- Buscar status atual
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Atualizar pedido
  UPDATE orders 
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;

  -- Registrar histórico
  INSERT INTO order_history (order_id, old_status, new_status, changed_by, changed_by_name, changed_by_role, action, notes)
  VALUES (p_order_id, v_old_status, p_new_status, p_changed_by, p_changed_by_name, p_changed_by_role, 'status_change', p_notes);

  -- Se cancelado, liberar estoque
  IF p_new_status = 'cancelled' THEN
    PERFORM release_stock_reservation(p_order_id);
  END IF;

  -- Se confirmado (pago), confirmar estoque
  IF p_new_status = 'paid' THEN
    PERFORM confirm_stock_reservation(p_order_id);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. RLS (ROW LEVEL SECURITY)
-- ============================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Payments: cliente vê seus, admin vê todos
CREATE POLICY "payments_select_own_or_admin" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_id 
      AND (auth.uid() = o.customer_id OR is_admin())
    )
  );

CREATE POLICY "payments_insert_admin" ON payments
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE USING (is_admin());

-- Order History: cliente vê seu pedido, admin vê tudo
CREATE POLICY "order_history_select_own_or_admin" ON order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_id 
      AND (auth.uid() = o.customer_id OR is_admin())
    )
  );

CREATE POLICY "order_history_insert_admin" ON order_history
  FOR INSERT WITH CHECK (is_admin());

-- Order Notes: notas públicas visíveis para cliente, internas só admin
CREATE POLICY "order_notes_select_own_or_admin" ON order_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_id 
      AND (
        auth.uid() = o.customer_id 
        OR is_admin()
        OR (is_admin() AND is_internal = false)
      )
    )
  );

CREATE POLICY "order_notes_insert_authenticated" ON order_notes
  FOR INSERT WITH CHECK (
    auth.uid() = author_id OR is_admin()
  );

-- Stock Reservations: só admin e sistema
CREATE POLICY "stock_reservations_select_admin" ON stock_reservations
  FOR SELECT USING (is_admin());

CREATE POLICY "stock_reservations_insert_admin" ON stock_reservations
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "stock_reservations_update_admin" ON stock_reservations
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- Trigger: Limpar reservas expiradas automaticamente (executa a cada INSERT)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Limpar reservas expiradas (apenas 1% das vezes para não impactar performance)
  IF random() < 0.01 THEN
    PERFORM cleanup_expired_reservations();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_reservations_trigger
  AFTER INSERT ON stock_reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_cleanup_expired_reservations();

-- ============================================================
-- 9. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE order_history;
ALTER PUBLICATION supabase_realtime ADD TABLE order_notes;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
