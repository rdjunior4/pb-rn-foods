# Deploy Supabase — PB&RN Foods

## 1. Aplicar o Schema

1. Acesse o **Supabase Dashboard** → projeto `yksxntkowxyjmkjlfwpf`
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo de `supabase/schema.sql` e execute
4. Cole o conteúdo de `supabase/seed.sql` e execute

## 2. Criar Usuário Admin

1. Vá em **Authentication** → **Users** → **Add user**
2. Email: `rosenildomoney@gmail.com`
3. Senha: `33milhoes`
4. Marque **Auto Confirm User**
5. Clique em **Create user**

Após criar, execute no SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'rosenildomoney@gmail.com';
```

## 3. Configurar Variáveis de Ambiente

Crie `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://yksxntkowxyjmkjlfwpf.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

A anon key está em:
**Project Settings** → **API** → **anon public**

## 4. Configurar Auth

Em **Authentication** → **Providers**:
- Email: **Enable**
- Configure URL de redirecionamento: `http://localhost:8080` (dev) / sua URL de produção

## 5. Estrutura Criada

### Tabelas (18)
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Extende auth.users (nome, documento, role) |
| `categories` | Categorias de produtos |
| `brands` | Marcas |
| `products` | Produtos |
| `product_variants` | Variantes (unidade, caixa, etc) |
| `orders` | Pedidos |
| `order_items` | Itens dos pedidos |
| `distributors` | Distribuidoras |
| `combos` | Combos promocionais |
| `combo_items` | Itens dos combos |
| `coupons` | Cupons de desconto |
| `product_reviews` | Avaliações |
| `stock_movements` | Movimentações de estoque |
| `banners` | Banners da loja |
| `pages` | Páginas CMS (sobre, termos, etc) |
| `store_config` | Configuração da loja (single-row) |
| `newsletter_subscribers` | Inscritos newsletter |
| `password_reset_codes` | Códigos de reset de senha |

### RLS (Row Level Security)
- **Público leitura**: categories, brands, products (ativos), combos (ativos), banners (ativos), pages, store_config, distributors
- **Cliente vê só seus**: orders, order_items
- **Logado cria**: product_reviews, orders
- **Admin tudo**: todas as tabelas (escrita)

### Funções RPC
- `decrement_stock_for_order(order_id, items)` — decrementa estoque atomicamente
- `validate_coupon(code, order_value, user_id)` — valida cupom com locks
- `increment_coupon_usage(coupon_id)` — incrementa contador
- `request_password_reset(email)` — gera código de reset
- `is_admin()` — verifica se usuário logado é admin

### Realtime
Habilitado para: `orders`, `order_items`, `stock_movements`, `product_reviews`

## 6. Próximos Passos

1. **Migrar auth-context.tsx** para usar `supabase.auth` em vez de localStorage
2. **Migrar admin-store.ts** para chamar a camada `api/` em vez de localStorage
3. **Migrar checkout.tsx** para usar `apiSaveOrder()` + `apiDecrementStock()`
4. **Configurar Storage** para upload de imagens (banners, logos, produtos)
5. **Configurar Edge Functions** para envio de emails (reset de senha, confirmação de pedido)
