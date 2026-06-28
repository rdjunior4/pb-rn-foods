-- ============================================================
-- Migration: Security hardening
-- 1. Stock check with FOR UPDATE (prevent overselling)
-- 2. Server-side price validation in create_order_atomic
-- 3. Remove double-decrement (variant OR product, not both)
-- ============================================================

-- 1. Replace decrement_stock_for_order with stock check + lock
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
  v_stock INTEGER;
  v_product_name TEXT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product := (item->>'productId')::UUID;
    v_variant := NULLIF(item->>'variantId', '')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    IF v_variant IS NOT NULL THEN
      -- Lock row and check stock
      SELECT stock INTO v_stock FROM product_variants WHERE id = v_variant FOR UPDATE;
      IF v_stock IS NULL THEN
        RAISE EXCEPTION 'Variante % não encontrada', v_variant;
      END IF;
      IF v_stock < v_qty THEN
        RAISE EXCEPTION 'Estoque insuficiente para variante % (disponível: %, solicitado: %)', v_variant, v_stock, v_qty;
      END IF;

      UPDATE product_variants SET stock = stock - v_qty WHERE id = v_variant;

      SELECT name INTO v_product_name FROM products WHERE id = v_product;
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
      VALUES (v_product, COALESCE(v_product_name, ''), 'out', v_qty, v_stock, v_stock - v_qty,
              'Venda — pedido ' || p_order_id, p_order_id);
    ELSE
      -- Lock row and check stock (product only, no double-decrement)
      SELECT stock INTO v_stock FROM products WHERE id = v_product FOR UPDATE;
      IF v_stock IS NULL THEN
        RAISE EXCEPTION 'Produto % não encontrado', v_product;
      END IF;
      IF v_stock < v_qty THEN
        RAISE EXCEPTION 'Estoque insuficiente para produto % (disponível: %, solicitado: %)', v_product, v_stock, v_qty;
      END IF;

      UPDATE products SET stock = stock - v_qty WHERE id = v_product;

      SELECT name INTO v_product_name FROM products WHERE id = v_product;
      INSERT INTO stock_movements (product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id)
      VALUES (v_product, COALESCE(v_product_name, ''), 'out', v_qty, v_stock, v_stock - v_qty,
              'Venda — pedido ' || p_order_id, p_order_id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Replace create_order_atomic with server-side price validation
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
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty INTEGER;
  v_client_price NUMERIC;
  v_real_price NUMERIC;
  v_server_subtotal NUMERIC;
  v_discount NUMERIC;
  v_shipping NUMERIC;
  v_total NUMERIC;
BEGIN
  v_order_id := p_order->>'id';

  -- 0. Validate prices server-side
  v_server_subtotal := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_variant_id := NULLIF(v_item->>'variantId', '')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;
    v_client_price := (v_item->>'price')::NUMERIC;

    IF v_variant_id IS NOT NULL THEN
      SELECT unit_price INTO v_real_price FROM product_variants WHERE id = v_variant_id;
    ELSE
      SELECT price INTO v_real_price FROM products WHERE id = v_product_id;
    END IF;

    IF v_real_price IS NULL THEN
      RETURN QUERY SELECT v_order_id, FALSE, 'Produto não encontrado: ' || v_product_id::TEXT;
      RETURN;
    END IF;

    -- Allow max 1% tolerance for rounding
    IF ABS(v_client_price - v_real_price) > (v_real_price * 0.01) THEN
      RETURN QUERY SELECT v_order_id, FALSE, 'Preço inválido para produto ' || v_product_id::TEXT || '. Use o preço atualizado.';
      RETURN;
    END IF;

    v_server_subtotal := v_server_subtotal + (v_real_price * v_qty);
  END LOOP;

  -- 1. Validate coupon if provided
  IF p_coupon_id IS NOT NULL AND p_coupon_code IS NOT NULL THEN
    SELECT v.ok, v.error INTO v_coupon_valid, v_coupon_error
    FROM validate_coupon(p_coupon_code, v_server_subtotal) v;

    IF NOT v_coupon_valid THEN
      RETURN QUERY SELECT v_order_id, FALSE, COALESCE(v_coupon_error, 'Cupom inválido');
      RETURN;
    END IF;

    PERFORM increment_coupon_usage(p_coupon_id);
  END IF;

  -- 2. Calculate totals server-side
  v_discount := COALESCE((p_order->>'discount')::NUMERIC, 0);
  v_shipping := COALESCE((p_order->>'shippingCost')::NUMERIC, 0);
  v_total := GREATEST(0, v_server_subtotal - v_discount + v_shipping);

  -- 3. Insert order with server-calculated prices
  INSERT INTO orders (
    id, customer_id, customer_name, customer_email, customer_document,
    customer_phone, items, subtotal, discount, shipping_cost, total,
    coupon_code, status, payment_method, shipping_address,
    latitude, longitude, distributor_id, shipping_carrier,
    created_at, updated_at
  ) VALUES (
    v_order_id,
    (p_order->>'customerId')::UUID,
    p_order->>'customerName',
    p_order->>'customerEmail',
    p_order->>'customerDocument',
    p_order->>'customerPhone',
    -- Store items with SERVER prices, not client prices
    (SELECT jsonb_agg(
      jsonb_build_object(
        'productId', item->>'productId',
        'variantId', item->>'variantId',
        'productName', item->>'productName',
        'quantity', item->>'quantity',
        'price', CASE
          WHEN NULLIF(item->>'variantId', '') IS NOT NULL THEN
            (SELECT unit_price FROM product_variants WHERE id = NULLIF(item->>'variantId', '')::UUID)
          ELSE
            (SELECT price FROM products WHERE id = (item->>'productId')::UUID)
        END,
        'image', item->>'image'
      )
    ) FROM jsonb_array_elements(p_items) AS item),
    v_server_subtotal,
    v_discount,
    v_shipping,
    v_total,
    p_coupon_code,
    'pending',
    p_order->>'paymentMethod',
    p_order->>'shippingAddress',
    NULLIF((p_order->>'latitude')::TEXT, '')::NUMERIC,
    NULLIF((p_order->>'longitude')::TEXT, '')::NUMERIC,
    NULLIF((p_order->>'distributorId')::TEXT, '')::UUID,
    NULLIF((p_order->>'shippingCarrier')::TEXT, ''),
    NOW(),
    NOW()
  );

  -- 4. Insert order items with server prices
  INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, price, image)
  SELECT
    v_order_id,
    (item->>'productId')::UUID,
    NULLIF(item->>'variantId', '')::UUID,
    item->>'productName',
    (item->>'quantity')::INTEGER,
    CASE
      WHEN NULLIF(item->>'variantId', '') IS NOT NULL THEN
        (SELECT unit_price FROM product_variants WHERE id = NULLIF(item->>'variantId', '')::UUID)
      ELSE
        (SELECT price FROM products WHERE id = (item->>'productId')::UUID)
    END,
    item->>'image'
  FROM jsonb_array_elements(p_items) AS item;

  -- 5. Decrement stock
  PERFORM decrement_stock_for_order(v_order_id, p_items);

  RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
