-- ============================================================
-- RPC: increment_customer_credit
-- Adiciona credito ao saldo do cliente e registra no historico
-- ============================================================
CREATE OR REPLACE FUNCTION increment_customer_credit(
  p_customer_id UUID,
  p_amount NUMERIC,
  p_order_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Credito adicionado'
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar saldo do cliente
  UPDATE customers
  SET credit_balance = credit_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_customer_id;

  -- Registrar no historico
  INSERT INTO credit_history (customer_id, amount, order_id, description)
  VALUES (p_customer_id, p_amount, p_order_id, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
