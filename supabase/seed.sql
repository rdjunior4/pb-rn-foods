-- ============================================================
--  PB&RN FOODS — Seed Data
--  Executar APÓS schema.sql
-- ============================================================

-- ============================================================
-- 1. CATEGORIAS
-- ============================================================
INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('mercearia', 'Mercearia', 'Wheat', 1),
  ('laticinios', 'Laticínios', 'Milk', 2),
  ('frios-queijos', 'Frios e Queijos', 'Sandwich', 3),
  ('carnes', 'Carnes', 'Beef', 4),
  ('aves-pescados', 'Aves e Pescados', 'Fish', 5),
  ('embutidos', 'Embutidos', 'Drumstick', 6),
  ('bebidas', 'Bebidas', 'Wine', 7),
  ('molhos-temperos', 'Molhos e Temperos', 'Soup', 8),
  ('limpeza-higiene', 'Limpeza e Higiene', 'Spray', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. MARCAS
-- ============================================================
INSERT INTO brands (name, slug, logo, active) VALUES
  ('Nestlé', 'nestle', 'https://logo.clearbit.com/nestle.com', true),
  ('Seara', 'seara', 'https://logo.clearbit.com/seara.com.br', true),
  ('Pilão', 'pilao', 'https://logo.clearbit.com/pilao.com.br', true),
  ('Aurora', 'aurora', 'https://logo.clearbit.com/auroraalimentos.com.br', true),
  ('Camponesa', 'camponesa', 'https://logo.clearbit.com/laticinioscamponesa.com.br', true),
  ('Hemmer', 'hemmer', 'https://logo.clearbit.com/hemmer.com.br', true),
  ('Bauducco', 'bauducco', 'https://logo.clearbit.com/bauducco.com.br', true),
  ('Yoki', 'yoki', 'https://logo.clearbit.com/yoki.com.br', true),
  ('Tio João', 'tio-joao', '', true),
  ('Liza', 'liza', '', true),
  ('União', 'uniao', '', true),
  ('Camil', 'camil', '', true),
  ('Renata', 'renata', '', true),
  ('Dona Benta', 'dona-benta', '', true),
  ('Cisne', 'cisne', '', true),
  ('Piracanjuba', 'piracanjuba', '', true),
  ('Tirolez', 'tirolez', '', true),
  ('Aviação', 'aviacao', '', true),
  ('Sadia', 'sadia', '', true),
  ('Coca-Cola', 'coca-cola', '', true),
  ('Del Valle', 'del-valle', '', true),
  ('Crystal', 'crystal', '', true),
  ('Heineken', 'heineken', '', true),
  ('Pérgola', 'pergola', '', true),
  ('Ypê', 'ype', '', true),
  ('Q''Boa', 'q-boa', '', true),
  ('Neve', 'neve', '', true),
  ('OMO', 'omo', '', true),
  ('Castelo', 'castelo', '', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. DISTRIBUIDORAS
-- ============================================================
INSERT INTO distributors (name, city, state, address, cep, latitude, longitude, coverage_mode, coverage_radius_km, coverage_cities, color, active) VALUES
  (
    'PB Foods',
    'João Pessoa', 'PB',
    'Av. Presidente Bandeira, 200',
    '58013-000',
    -7.12, -34.86,
    'city', 120,
    '["João Pessoa","Campina Grande","Santa Rita","Patos","Bayeux","Sousa","Cajazeiras","Guarabira","Sapé","Queimadas"]'::jsonb,
    '#ef4444', true
  ),
  (
    'RN Foods',
    'Caicó', 'RN',
    'Praça Augusto Severo, 100',
    '59300-000',
    -6.46, -36.59,
    'city', 150,
    '["Caicó","Natal","Mossoró","Parnamirim","São Gonçalo do Amarante","Macaíba","Ceará-Mirim","Açu","Currais Novos","São José de Mipibu"]'::jsonb,
    '#3b82f6', true
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. PÁGINAS CMS (defaults)
-- ============================================================
INSERT INTO pages (slug, title, content, in_footer) VALUES
  ('sobre', 'Sobre Nós',
    '## PB&RN Foods\n\nDistribuidora de alimentos B2B atuando na Paraíba e Rio Grande do Norte.\n\n### Nossa missão\nAbastecer o seu negócio com variedade, marcas selecionadas e logística eficiente.',
    true),
  ('termos', 'Termos de Uso',
    '## Termos e Condições\n\nAo utilizar nossa plataforma, você concorda com os termos abaixo.\n\n### Compras no atacado\nOs preços exibidos são válidos para compras no atacado.',
    true),
  ('faq', 'Perguntas Frequentes',
    '## FAQ\n\n### Como faço um pedido?\nNavegue pelo catálogo, adicione produtos ao carrinho e finalize no checkout.\n\n### Quais formas de pagamento?\nAceitamos cartão de crédito, boleto e Pix.',
    true),
  ('privacidade', 'Política de Privacidade',
    '## Política de Privacidade\n\nRespeitamos sua privacidade e protegemos seus dados pessoais conforme a LGPD.',
    true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. STORE_CONFIG (linha única)
-- ============================================================
INSERT INTO store_config (id, config) VALUES (
  1,
  '{
    "storeName": "PB&RN Foods",
    "storeDescription": "Distribuidora de alimentos B2B — variedade, marcas selecionadas e logística eficiente para o seu negócio.",
    "phone": "(83) 99999-9999",
    "email": "contato@pbrnfoods.com.br",
    "address": "João Pessoa, PB",
    "hero": {
      "enabled": true,
      "title": "Abastecimento inteligente para o seu negócio",
      "subtitle": "Compre no atacado com condições exclusivas para CNPJ",
      "ctaText": "Ver produtos",
      "ctaLink": "/buscar"
    },
    "benefits": [
      {"id": "b1", "icon": "Truck", "title": "Entrega Nordeste", "description": "Frete grátis para toda região Nordeste"},
      {"id": "b2", "icon": "Package", "title": "Atacado B2B", "description": "Preços especiais por volume"},
      {"id": "b3", "icon": "ShieldCheck", "title": "Qualidade garantida", "description": "Marcas selecionadas e verificadas"},
      {"id": "b4", "icon": "Headphones", "title": "Suporte dedicado", "description": "Atendimento de segunda a sábado"}
    ],
    "featuredBrandIds": [],
    "sections": [
      {"id": "s1", "type": "hero", "title": "Banner principal", "style": "default", "variant": "default", "active": true, "order": 0},
      {"id": "s2", "type": "categories-grid", "title": "Categorias", "style": "default", "variant": "default", "active": true, "order": 1},
      {"id": "s3", "type": "offer-products", "title": "Ofertas especiais", "style": "default", "variant": "featured", "active": true, "order": 2},
      {"id": "s4", "type": "brands", "title": "Marcas parceiras", "style": "default", "variant": "default", "active": true, "order": 3},
      {"id": "s5", "type": "combos", "title": "Combos promocionais", "style": "default", "variant": "default", "active": true, "order": 4},
      {"id": "s6", "type": "benefits", "title": "Benefícios", "style": "default", "variant": "default", "active": true, "order": 5},
      {"id": "s7", "type": "newsletter", "title": "Newsletter", "style": "default", "variant": "default", "active": true, "order": 6}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ADMIN USER
--    O usuário admin deve ser criado via Supabase Dashboard
--    (Authentication > Users > Add user) com:
--    Email: rosenildomoney@gmail.com
--    Senha: 33milhoes
--
--    Após criar o usuário, executar:
--    UPDATE profiles SET role = 'admin' WHERE email = 'rosenildomoney@gmail.com';
-- ============================================================

-- ============================================================
-- 7. PRODUTOS (exemplo — importar do data.ts)
-- ============================================================
-- Os produtos podem ser importados via script Node ou
-- inseridos manualmente. Abaixo um exemplo:

DO $$
DECLARE
  cat_mercearia UUID;
  cat_laticinios UUID;
  cat_bebidas UUID;
  cat_carnes UUID;
  cat_limpeza UUID;
  cat_frios UUID;
  cat_aves UUID;
  cat_embutidos UUID;
  cat_molhos UUID;
BEGIN
  SELECT id INTO cat_mercearia FROM categories WHERE slug = 'mercearia';
  SELECT id INTO cat_laticinios FROM categories WHERE slug = 'laticinios';
  SELECT id INTO cat_bebidas FROM categories WHERE slug = 'bebidas';
  SELECT id INTO cat_carnes FROM categories WHERE slug = 'carnes';
  SELECT id INTO cat_limpeza FROM categories WHERE slug = 'limpeza-higiene';
  SELECT id INTO cat_frios FROM categories WHERE slug = 'frios-queijos';
  SELECT id INTO cat_aves FROM categories WHERE slug = 'aves-pescados';
  SELECT id INTO cat_embutidos FROM categories WHERE slug = 'embutidos';
  SELECT id INTO cat_molhos FROM categories WHERE slug = 'molhos-temperos';

  -- Mercearia
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('arroz-tio-joao-5kg', 'Arroz Tio João Parboilizado 5kg', 'Arroz parboilizado de alta qualidade',
     '["Grãos selecionados","Parboilização que preserva nutrientes","Embalagem hermética"]'::jsonb,
     '[{"label":"Marca","value":"Tio João"},{"label":"Peso","value":"5kg"},{"label":"Tipo","value":"Parboilizado"}]'::jsonb,
     cat_mercearia, 'Tio João', 24.90, 27.90, 'un',
     'https://picsum.photos/seed/arroz-tio-joao/400/400',
     '["https://picsum.photos/seed/arroz-tio-joao/400/400","https://picsum.photos/seed/arroz-tio-joao-2/400/400","https://picsum.photos/seed/arroz-tio-joao-3/400/400"]'::jsonb,
     10, 50, true),
    ('oleo-soja-liza-900ml', 'Óleo de Soja Liza Pet 900ml', 'Óleo de soja refinado',
     '["Alto ponto de fumaça","Neutro","Garrafa pet ergonômica"]'::jsonb,
     '[{"label":"Marca","value":"Liza"},{"label":"Volume","value":"900ml"},{"label":"Tipo","value":"Óleo de Soja"}]'::jsonb,
     cat_mercearia, 'Liza', 6.59, 7.49, 'un',
     'https://picsum.photos/seed/oleo-soja-liza/400/400', '[]'::jsonb, 12, 80, true),
    ('acucar-refinado-uniao-5kg', 'Açúcar Refinado União 5kg', 'Açúcar refinado de alta pureza',
     '["Cristais finos","Dissolução rápida","Ideal para confeitaria"]'::jsonb,
     '[{"label":"Marca","value":"União"},{"label":"Peso","value":"5kg"}]'::jsonb,
     cat_mercearia, 'União', 19.90, 22.90, 'un',
     'https://picsum.photos/seed/acucar-refinado-uniao/400/400', '[]'::jsonb, 13, 40, false),
    ('feijao-carioca-camil-1kg', 'Feijão Carioca Camil 1kg', 'Feijão carioca tipo 1',
     '["Grãos selecionados","Pré-cozido","Sabor tradicional"]'::jsonb,
     '[{"label":"Marca","value":"Camil"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_mercearia, 'Camil', 7.99, 9.49, 'un',
     'https://picsum.photos/seed/feijao-carioca-camil/400/400', '[]'::jsonb, 15, 60, false),
    ('macarrao-espaguete-renata-500g', 'Macarrão Espaguete Renata 500g', 'Massa de sêmola de trigo durum',
     '["Textura firme","Não gruda","Perfeito para molhos clássicos"]'::jsonb,
     '[{"label":"Marca","value":"Renata"},{"label":"Peso","value":"500g"}]'::jsonb,
     cat_mercearia, 'Renata', 4.29, 5.20, 'un',
     'https://picsum.photos/seed/macarrao-espaguete-renata/400/400', '[]'::jsonb, 17, 100, false),
    ('cafe-pilao-tradicional-500g', 'Café Pilão Tradicional 500g', 'Café torrado e moído',
     '["Sabor intenso","Aroma encorpado","Consumo diário"]'::jsonb,
     '[{"label":"Marca","value":"Pilão"},{"label":"Peso","value":"500g"},{"label":"Moagem","value":"Fina"}]'::jsonb,
     cat_mercearia, 'Pilão', 18.59, 21.20, 'un',
     'https://picsum.photos/seed/cafe-pilao-tradicional/400/400', '[]'::jsonb, 15, 45, true),
    ('sal-refinado-cisne-1kg', 'Sal Refinado Cisne 1kg', 'Sal refinado iodado',
     '["Cristais finos","Iodado","Dissolução fácil"]'::jsonb,
     '[{"label":"Marca","value":"Cisne"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_mercearia, 'Cisne', 2.89, 3.49, 'un',
     'https://picsum.photos/seed/sal-refinado-cisne/400/400', '[]'::jsonb, 17, 120, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Laticínios
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('leite-integral-piracanjuba-1l', 'Leite Integral Piracanjuba 1L', 'Leite integral pasteurizado',
     '["Rico em cálcio","Vitaminas A e D","Sabor cremoso"]'::jsonb,
     '[{"label":"Marca","value":"Piracanjuba"},{"label":"Volume","value":"1L"},{"label":"Conservação","value":"Refrigerado"}]'::jsonb,
     cat_laticinios, 'Piracanjuba', 5.05, 5.49, 'un',
     'https://picsum.photos/seed/leite-integral-piracanjuba/400/400', '[]'::jsonb, 8, 90, true),
    ('queijo-mussarela-tirolez-kg', 'Queijo Mussarela Tirolez kg', 'Queijo mussarela tradicional',
     '["Textura macia","Sabor suave","Perfeito para pizzas"]'::jsonb,
     '[{"label":"Marca","value":"Tirolez"},{"label":"Peso","value":"1kg"},{"label":"Conservação","value":"Refrigerado"}]'::jsonb,
     cat_laticinios, 'Tirolez', 42.90, 49.90, 'kg',
     'https://picsum.photos/seed/queijo-mussarela-tirolez/400/400', '[]'::jsonb, 14, 25, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Bebidas
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('coca-cola-2l', 'Coca-Cola Pet 2L', 'Refrigerante Coca-Cola sabor original',
     '["Sabor inconfundível","Garrafa pet 2L","Perfeito para confraternizações"]'::jsonb,
     '[{"label":"Marca","value":"Coca-Cola"},{"label":"Volume","value":"2L"}]'::jsonb,
     cat_bebidas, 'Coca-Cola', 8.49, 9.99, 'un',
     'https://picsum.photos/seed/coca-cola/400/400', '[]'::jsonb, 15, 200, true),
    ('suco-del-valle-laranja-1l', 'Suco Del Valle Laranja 1L', 'Suco de laranja integral',
     '["Sem açúcar adicionado","Vitamina C natural","Embalagem longa vida"]'::jsonb,
     '[{"label":"Marca","value":"Del Valle"},{"label":"Volume","value":"1L"}]'::jsonb,
     cat_bebidas, 'Del Valle', 7.29, 8.90, 'un',
     'https://picsum.photos/seed/suco-del-valle/400/400', '[]'::jsonb, 18, 85, false),
    ('cerveja-heineken-ln-330ml', 'Cerveja Heineken Long Neck 330ml', 'Cerveja puro malte premium',
     '["Receita holandesa","Sabor encorpado","Long neck 330ml"]'::jsonb,
     '[{"label":"Marca","value":"Heineken"},{"label":"Volume","value":"330ml"},{"label":"Teor","value":"5%"}]'::jsonb,
     cat_bebidas, 'Heineken', 6.49, 7.90, 'un',
     'https://picsum.photos/seed/cerveja-heineken/400/400', '[]'::jsonb, 18, 150, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Carnes
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured, pricing_tiers)
  VALUES
    ('contrafile-bovino-kg', 'Contrafilé Bovino Peça a Vácuo kg', 'Contrafilé bovino selecionado a vácuo',
     '["Embalado a vácuo","Corte nobre","Ideal para churrascos"]'::jsonb,
     '[{"label":"Marca","value":"Seara"},{"label":"Peso","value":"1kg"},{"label":"Conservação","value":"Refrigerado"}]'::jsonb,
     cat_carnes, 'Seara', 45.50, 49.90, 'kg',
     'https://picsum.photos/seed/contrafile-bovino/400/400',
     '["https://picsum.photos/seed/contrafile-bovino/400/400","https://picsum.photos/seed/contrafile-bovino-2/400/400"]'::jsonb,
     9, 20, true,
     '[{"id":"t1","minQuantity":1,"pricePerUnit":45.50,"discountPercent":0,"label":"A partir de 1 kg"},{"id":"t2","minQuantity":10,"pricePerUnit":43.99,"discountPercent":3,"label":"A partir de 10 kg"},{"id":"t3","minQuantity":50,"pricePerUnit":41.50,"discountPercent":9,"label":"A partir de 50 kg"}]'::jsonb
    )
  ON CONFLICT (slug) DO NOTHING;

  -- Limpeza
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('detergente-ype-500ml', 'Detergente Ypê Neutro 500ml', 'Detergente neutro biodegradável',
     '["Alta concentração","Remove gordura","Suave para as mãos"]'::jsonb,
     '[{"label":"Marca","value":"Ypê"},{"label":"Volume","value":"500ml"}]'::jsonb,
     cat_limpeza, 'Ypê', 2.79, 3.49, 'un',
     'https://picsum.photos/seed/detergente-ype/400/400', '[]'::jsonb, 20, 95, false),
    ('agua-sanitaria-qboa-2l', 'Água Sanitária Q''Boa 2L', 'Água sanitária concentrada',
     '["Elimina germes","Clareia roupas","Ação desinfetante"]'::jsonb,
     '[{"label":"Marca","value":"Q''Boa"},{"label":"Volume","value":"2L"}]'::jsonb,
     cat_limpeza, 'Q''Boa', 7.99, 9.90, 'un',
     'https://picsum.photos/seed/agua-sanitaria-qboa/400/400', '[]'::jsonb, 19, 75, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Frios
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('presunto-cozido-sadia-kg', 'Presunto Cozido Sadia kg', 'Presunto cozido selecionado',
     '["Corte nobre","Fatiado ou em peça","Sabor suave"]'::jsonb,
     '[{"label":"Marca","value":"Sadia"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_frios, 'Sadia', 33.50, 38.90, 'kg',
     'https://picsum.photos/seed/presunto-cozido-sadia/400/400', '[]'::jsonb, 13, 30, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Aves
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('peito-frango-resfriado-kg', 'Peito de Frango Resfriado kg', 'Peito de frango resfriado',
     '["Corte nobre","Alto teor de proteínas","Versátil"]'::jsonb,
     '[{"label":"Marca","value":"Sadia"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_aves, 'Sadia', 15.90, 18.90, 'kg',
     'https://picsum.photos/seed/peito-frango-resfriado/400/400', '[]'::jsonb, 15, 40, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Embutidos
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('linguica-toscana-seara-kg', 'Linguiça Toscana Seara kg', 'Linguiça toscana artesanal',
     '["Tempero tradicional","Suculenta","Ideal para churrasco"]'::jsonb,
     '[{"label":"Marca","value":"Seara"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_embutidos, 'Seara', 22.50, 26.90, 'kg',
     'https://picsum.photos/seed/linguica-toscana-seara/400/400', '[]'::jsonb, 16, 35, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Molhos
  INSERT INTO products (slug, name, description, details, specs, category_id, brand_name, price, old_price, unit, image, images, discount, stock, featured)
  VALUES
    ('molho-tomate-seara-kg', 'Molho de Tomate Seara Refogado kg', 'Molho de tomate temperado',
     '["Pronto para uso","Tomates selecionados","Ideal para massas"]'::jsonb,
     '[{"label":"Marca","value":"Seara"},{"label":"Peso","value":"1kg"}]'::jsonb,
     cat_molhos, 'Seara', 16.79, 18.90, 'un',
     'https://picsum.photos/seed/molho-tomate-seara/400/400', '[]'::jsonb, 11, 55, false)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- ============================================================
-- 8. VARIANTES (exemplos para produtos com variantes)
-- ============================================================
DO $$
DECLARE
  p_arroz UUID;
  p_contrafile UUID;
  p_agua UUID;
BEGIN
  SELECT id INTO p_arroz FROM products WHERE slug = 'arroz-tio-joao-5kg';
  SELECT id INTO p_contrafile FROM products WHERE slug = 'contrafile-bovino-kg';

  IF p_arroz IS NOT NULL THEN
    INSERT INTO product_variants (product_id, label, unit_price, old_price, stock, unit)
    VALUES
      (p_arroz, 'Unidade', 24.90, 27.90, 50, 'un'),
      (p_arroz, 'Caixa (10un)', 22.90, 27.90, 20, 'un')
    ON CONFLICT DO NOTHING;
  END IF;

  IF p_contrafile IS NOT NULL THEN
    INSERT INTO product_variants (product_id, label, unit_price, old_price, stock, unit)
    VALUES
      (p_contrafile, 'Peso (kg)', 45.50, 49.90, 20, 'kg'),
      (p_contrafile, 'Peça (aprox. 8kg)', 43.99, 49.90, 10, 'kg'),
      (p_contrafile, 'Caixa (aprox. 24kg)', 43.99, 49.90, 5, 'kg')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- FIM DO SEED
-- ============================================================
