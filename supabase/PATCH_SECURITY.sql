-- PATCH: Segurança create_order_atomic — validar auth.uid() = customerId
-- Execute no Supabase Dashboard > SQL Editor
--
-- Previne que um usuario autenticado crie pedidos em nome de outro cliente.

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order JSONB,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_coupon_id UUID DEFAULT NULL
)
RETURNS TABLE(order_id TEXT, ok BOOLEAN, error TEXT) AS $$
DECLARE
  v_order_id TEXT;
  v_coupon_valid BOOLEAN;
  v_coupon_error TEXT;
  v_customer_id TEXT;
BEGIN
  v_order_id := p_order->>'id';
  v_customer_id := p_order->>'customerId';

  -- 0. Validar identidade: usuario autenticado so pode criar pedido para si mesmo
  IF auth.uid() IS NOT NULL AND v_customer_id IS NOT NULL AND v_customer_id <> 'guest' THEN
    IF auth.uid() <> v_customer_id::UUID THEN
      RETURN QUERY SELECT v_order_id, FALSE, 'Acesso negado: voce so pode criar pedidos para sua propria conta'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 1. Validar cupom se fornecido
  IF p_coupon_id IS NOT NULL AND p_coupon_code IS NOT NULL THEN
    SELECT v.ok, v.error INTO v_coupon_valid, v_coupon_error
    FROM validate_coupon(p_coupon_code, (p_order->>'subtotal')::NUMERIC) v;

    IF NOT v_coupon_valid THEN
      RETURN QUERY SELECT v_order_id, FALSE, COALESCE(v_coupon_error, 'Cupom invalido');
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
    NULLIF(v_customer_id, 'guest')::UUID,
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
    NULLIF(item->>'productId', '')::UUID,
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