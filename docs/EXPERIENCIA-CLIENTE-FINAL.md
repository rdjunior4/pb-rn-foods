<div align="center">

# 📋 Experiência do Cliente Final

### PB&RN Foods — Plataforma de E-Commerce B2B

---

**Versão:** 1.0  
**Data:** Julho 2026  
**Status:** Produção

</div>

---

## 📑 Sumário

1. [Visão Geral](#1-visão-geral)
2. [Jornada do Cliente](#2-jornada-do-cliente)
3. [Páginas e Rotas](#3-páginas-e-rotas)
4. [Funcionalidades Detalhadas](#4-funcionalidades-detalhadas)
5. [Design System](#5-design-system)
6. [Infraestrutura Técnica](#6-infraestrutura-técnica)
7. [Métricas e KPIs](#7-métricas-e-kpis)

---

## 1. Visão Geral

### 1.1 O que é a PB&RN Foods?

A **PB&RN Foods** é uma plataforma de e-commerce **B2B (Business-to-Business)** especializada na distribuição de alimentos para pequenos e médios negócios da região **Nordeste do Brasil**.

### 1.2 Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Primário** | Donos de mercados, mercearias, bares e restaurantes |
| **Documento** | CNPJ (empresas) ou CPF (microempreendedores) |
| **Região** | Nordeste do Brasil (MA, PI, CE, RN, PB, PE, AL, SE, BA) |
| **Necessidade** | Abastecimento regular com preços competitivos e entrega confiável |

### 1.3 Proposta de Valor

| Benefício | Descrição |
|-----------|-----------|
| 🏷️ **Marcas Selecionadas** | Parcerias com as melhores marcas do mercado |
| 💰 **Condições Exclusivas** | Preços especiais e benefícios para clientes CNPJ |
| 🚚 **Logística Ágil** | Entregas rápidas e pontuais em toda a região Nordeste |
| 🎧 **Atendimento Especializado** | Suporte dedicado com consultores para seu negócio |

### 1.4 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TanStack Start |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel |
| Monitoramento | Sentry |
| Cache | TanStack Query (React Query) |

---

## 2. Jornada do Cliente

### 2.1 Fluxo Completo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. CHEGADA │───▶│  2. BUSCA   │───▶│  3. PRODUTO │───▶│  4. CARRINHO│
│  Homepage   │    │  Catálogo   │    │  Detalhe    │    │  Itens      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  8. CONTA   │◀───│  7. PEDIDO  │◀───│  6. CONFIRMA│◀───│  5. CHECKOUT│
│  Minha Conta│    │  Tracking   │    │  Sucesso    │    │  4 etapas   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 Detalhamento das Etapas

| Etapa | Página | Ação do Cliente | Resultado |
|-------|--------|-----------------|-----------|
| **1. Chegada** | Homepage | Visualiza banner, benefícios, ofertas | Descobre a loja |
| **2. Busca** | Buscar / Categorias | Pesquisa produto ou navega por categoria | Encontra item desejado |
| **3. Produto** | Detalhe do Produto | Visualiza preço, variantes, especificações | Decide comprar |
| **4. Carrinho** | Carrinho | Adiciona itens, ajusta quantidades | Itens selecionados |
| **5. Checkout** | Checkout (4 etapas) | Informa endereço, dados, pagamento | Dados completos |
| **6. Confirmação** | Pedido Confirmado | Visualiza resumo e próximos passos | Pedido realizado |
| **7. Pedido** | Detalhe do Pedido | Acompanha status em tempo real | Recebe entrega |
| **8. Conta** | Minha Conta | Gerencia dados, endereços, pagamentos | Perfil completo |

---

## 3. Páginas e Rotas

### 3.1 Mapa de Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | **Homepage** | Página inicial com banner, benefícios, ofertas, combos, newsletter |
| `/buscar?q=...` | **Busca** | Busca full-text com filtros de ordenação e paginação |
| `/categoria/$slug` | **Categoria** | Lista de produtos por categoria com ordenação |
| `/produto/$slug` | **Produto** | Detalhe completo: galeria, variantes, preços, avaliações |
| `/carrinho` | **Carrinho** | Lista de itens com controles de quantidade |
| `/checkout` | **Checkout** | Fluxo de 4 etapas: recebimento, endereço, dados, pagamento |
| `/pedido-confirmado?id=...` | **Confirmação** | Tela de sucesso com resumo do pedido |
| `/pedido/$id` | **Detalhe do Pedido** | Tracking em tempo real com timeline de status |
| `/entrar` | **Login/Cadastro** | Modal de autenticação (login, cadastro, recuperação) |
| `/minha-conta` | **Minha Conta** | Dashboard com pedidos recentes e navegação |
| `/minha-conta/enderecos` | **Endereços** | CRUD de endereços de entrega |
| `/minha-conta/pagamentos` | **Pagamentos** | CRUD de formas de pagamento |
| `/favoritos` | **Favoritos** | Lista de desejos com botão de adicionar ao carrinho |
| `/pagina/$slug` | **Páginas Estáticas** | FAQ, Termos, Privacidade, Sobre |

---

## 4. Funcionalidades Detalhadas

---

### 4.1 Homepage

**Rota:** `/`

A página inicial é a vitrine principal da loja, projetada para guiar o cliente desde a chegada até a primeira compra.

![Screenshot: Homepage](docs/screenshots/homepage-hero.png)
> *Hero banner com carrossel automático, título "Abastecimento inteligente para o seu negócio" e botões de ação*

#### Seções da Homepage

| Seção | Descrição |
|-------|-----------|
| **Hero Banner** | Carrossel automático (6s) com imagens desktop/mobile,CTAs "Explorar catálogo" e "Cadastre-se CNPJ" |
| **Marcas em Destaque** | Carrossel infinito de logos de marcas parceiras com efeito hover |
| **Barra de Benefícios** | 4 cards com gradientes: Marcas Selecionadas, Condições Exclusivas, Logística Ágil, Atendimento Especializado |
| **Ofertas Imperdíveis** | Grid de até 6 produtos com desconto ≥ 10% |
| **Mais Vendidos** | Produtos por categoria: Mercearia, Bebidas, Carnes, Limpeza |
| **Combos Promocionais** | Kits com economia, botão "Adicionar" com 1 clique |
| **Newsletter** | Cadastro de e-mail para ofertas exclusivas |

![Screenshot: Benefícios](docs/screenshots/homepage-beneficios.png)
> *Barra de benefícios com 4 cards em gradiente verde e ícones*

---

### 4.2 Catálogo e Busca

**Rotas:** `/buscar`, `/categoria/$slug`

#### Funcionalidades de Busca

| Recurso | Descrição |
|---------|-----------|
| **Busca Full-Text** | Pesquisa por nome do produto e marca |
| **Ordenação** | Preço (crescente/decrescente) e Nome (A-Z) |
| **Paginação** | 12 itens por página com navegação |
| **Dicas de Busca** | Exibe categorias quando nenhum resultado é encontrado |

#### Funcionalidades de Categoria

| Recurso | Descrição |
|---------|-----------|
| **Filtro por Categoria** | Navega verticalmente por categorias |
| **Ícones Dinâmicos** | 80+ ícones organizados em 16 grupos |
| **Contador de Produtos** | Exibe quantidade de itens por categoria |

![Screenshot: Catálogo](docs/screenshots/catalogo-produtos.png)
> *Grid de produtos com cards de imagem, preço, desconto e botão de adicionar*

---

### 4.3 Página de Produto

**Rota:** `/produto/$slug`

A página de produto é projetada para fornecer todas as informações necessárias para a decisão de compra.

![Screenshot: Produto](docs/screenshots/produto-detalhe.png)
> *Detalhe do produto com galeria de imagens, seletor de variantes, preços e botão de compra*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Galeria de Imagens** | Navegação entre imagens com miniaturas |
| **Seletor de Variantes** | Escolha entre unidades (un, kg, caixa) |
| **Preços por Volume** | Tabela "Leve mais, pague menos" com descontos progressivos |
| **Indicador de Estoque** | Exibe disponibilidade em tempo real |
| **Botão de Favorito** | Coração para adicionar à lista de desejos |
| **Compartilhar** | Botão para copiar link do produto |
| **Avaliações** | Seção de reviews com estrelas e comentários |
| **Produtos Relacionados** | Carrossel de itens da mesma categoria |

#### Indicadores de Estoque

| Status | Cor | Significado |
|--------|-----|-------------|
| `≥ 10` | Verde | Em estoque |
| `1-9` | Amarelo | Últimas unidades |
| `0` | Vermelho | Indisponível |

---

### 4.4 Carrinho de Compras

**Rota:** `/carrinho` + `CartDrawer` (drawer lateral)

![Screenshot: Carrinho](docs/screenshots/carrinho.png)
> *Carrinho lateral com lista de itens, controles de quantidade e subtotal*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Drawer Lateral** | Abre pela direita ao adicionar item |
| **Controles de Quantidade** | Botões +/- para ajustar quantidade |
| **Remoção de Itens** | Ícone de lixeira em cada item |
| **Limpar Carrinho** | Botão para remover todos os itens |
| **Subtotal** | Cálculo automático do valor total |
| **Validação de Estoque** | Impede adicionar mais que o estoque disponível |
| **Persistência** | Dados salvos no Supabase (usuário logado) |

#### Comportamento por Estado

| Estado | Ação |
|--------|------|
| **Vazio** | Exibe mensagem "Seu carrinho está vazio" com CTA para continuar comprando |
| **Com itens** | Lista produtos com imagem, nome, marca, quantidade e preço |
| **Hover no item** | Exibe ícone de lixeira para remoção rápida |

---

### 4.5 Checkout (4 Etapas)

**Rota:** `/checkout`

O checkout é o fluxo mais crítico da experiência, dividido em 4 etapas claras.

![Screenshot: Checkout](docs/screenshots/checkout-etapa-1.png)
> *Etapa 1: Seleção de forma de recebimento (Entrega Própria ou Retirada no Local)*

#### Etapa 1: Como Deseja Receber?

| Opção | Descrição |
|-------|-----------|
| **🚚 Entrega Própria** | Receba no seu endereço com frete grátis para o Nordeste |
| **🏪 Retirada no Local** | Retire na loja em Campina Grande - PB |

![Screenshot: Checkout Endereço](docs/screenshots/checkout-etapa-2.png)
> *Etapa 2: Preenchimento do endereço com auto-complete de CEP*

#### Etapa 2: Endereço de Entrega

| Recurso | Descrição |
|---------|-----------|
| **Busca de CEP** | Auto-complete via API ViaCEP |
| **Endereços Salvos** | Seleciona de endereços cadastrados na conta |
| **Geolocalização** | Detecta localização automaticamente (com consentimento) |
| **Distribuidora** | Atribui distribuidora automaticamente por raio ou cidade |
| **Frete Grátis** | Aplicado automaticamente para estados do Nordeste |

![Screenshot: Checkout Dados](docs/screenshots/checkout-etapa-3.png)
> *Etapa 3: Dados pessoais com telefone e CPF/CNPJ*

#### Etapa 3: Dados Pessoais

| Campo | Descrição |
|-------|-----------|
| **Telefone** | Formato (00) 00000-0000 |
| **Tipo de Documento** | CPF ou CNPJ |
| **Número do Documento** | Formatação automática |

![Screenshot: Checkout Pagamento](docs/screenshots/checkout-etapa-4.png)
> *Etapa 4: Seleção de forma de pagamento*

#### Etapa 4: Pagamento

| Método | Descrição |
|--------|-----------|
| **💳 Cartão de Crédito** | Pagamento parcelado |
| **📄 Boleto Bancário** | Pagamento à vista |
| **⚡ PIX** | Pagamento instantâneo |

#### Funcionalidades do Checkout

| Recurso | Descrição |
|---------|-----------|
| **Cupom de Desconto** | Campo para aplicar cupom com validação em tempo real |
| **Resumo do Pedido** | Sidebar com lista de itens, subtotal, desconto, frete e total |
| **Frete Grátis** | Automático para Nordeste ou com cupom `freeship` |
| **Criação Atômica** | Pedido criado em 1 transação (order + items + stock + coupon) |

---

### 4.6 Confirmação do Pedido

**Rota:** `/pedido-confirmado`

![Screenshot: Confirmação](docs/screenshots/pedido-confirmado.png)
> *Tela de sucesso com número do pedido, resumo completo e próximos passos*

#### Conteúdo da Página

| Seção | Descrição |
|-------|-----------|
| **Ícone de Sucesso** | Círculo verde grande com check |
| **Número do Pedido** | Código formatado (ex: PN2606161437ABCD) |
| **Resumo do Pedido** | Lista de itens com imagem, nome, quantidade e preço |
| **Breakdown Financeiro** | Subtotal, Desconto, Frete, Total |
| **Dados de Contato** | Telefone, Documento, Endereço, Pagamento |
| **Distribuidora** | Nome e localização da distribuidora responsável |
| **Próximos Passos** | 3 etapas numeradas com orientações |

---

### 4.7 Acompanhamento de Pedido

**Rota:** `/pedido/$id`

![Screenshot: Pedido](docs/screenshots/pedido-detalhe.png)
> *Detalhe do pedido com timeline de status, endereço, pagamento e itens*

#### Timeline de Status

```
Pendente ──▶ Confirmado ──▶ Preparando ──▶ Enviado ──▶ Entregue
    │              │              │             │            │
    ▼              ▼              ▼             ▼            ▼
  🟡              🔵              🟣            🟣           🟢
```

| Status | Cor | Descrição |
|--------|-----|-----------|
| **Pendente** | 🟡 Amarelo | Pedido recebido, aguardando confirmação |
| **Confirmado** | 🔵 Azul | Pedido confirmado pelo estoque |
| **Preparando** | 🟣 Roxo | Separação e embalagem em andamento |
| **Enviado** | 🟣 Roxo | Pedido em trânsito |
| **Entregue** | 🟢 Verde | Pedido entregue ao cliente |
| **Cancelado** | 🔴 Vermelho | Pedido cancelado |

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Atualização em Tempo Real** | Supabase Realtime via WebSocket |
| **Timeline Visual** | Steps conectados com setas |
| **Informações de Rastreio** | Código de rastreio e transportadora |
| **Dados da Distribuidora** | Nome, cidade e estado |

---

### 4.8 Autenticação

**Rota:** `/entrar` + `AuthModal` (modal)

![Screenshot: Login](docs/screenshots/auth-modal-login.png)
> *Modal de login com campos de e-mail e senha, link "Esqueci minha senha"*

![Screenshot: Cadastro](docs/screenshots/auth-modal-cadastro.png)
> *Modal de cadastro com nome, e-mail, senha, confirmação e CPF/CNPJ*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Login** | E-mail + senha com validação |
| **Cadastro** | Nome, e-mail, senha, documento (CPF/CNPJ) |
| **Auto-detecção de Documento** | Identifica CPF ou CNPJ automaticamente |
| **Mostrar/Ocultar Senha** | Botão de visibilidade nos campos de senha |
| **Recuperação de Senha** | Fluxo em 3 etapas: e-mail → código → nova senha |
| **Confirmação de E-mail** | Tratamento de usuários com e-mail não confirmado |
| **Limitação de Tentativas** | Rate limiting no client-side |
| **Redirecionamento** | Volta para a página anterior após login |

---

### 4.9 Minha Conta

**Rota:** `/minha-conta`

![Screenshot: Minha Conta](docs/screenshots/minha-conta.png)
> *Dashboard com avatar, nome, badges, stats e navegação por seções*

#### Header do Perfil

| Elemento | Descrição |
|----------|-----------|
| **Avatar** | Upload de foto com ícone de câmera no hover |
| **Nome** | Nome completo do usuário |
| **Badges** | Tipo de documento (CPF/CNPJ) + Ano de cadastro |
| **Stats** | Pedidos, Ativos, Gasto Total, Favoritos |
| **Botões** | Editar perfil + Sair |

#### Seções de Navegação

| Seção | Itens |
|-------|-------|
| **Pedidos** | Meus pedidos, Carrinhos salvos |
| **Favoritos** | Lista de desejos, Produtos vistos |
| **Dados da Conta** | Dados pessoais, Endereços, Pagamentos |
| **Suporte** | Central de ajuda, Notificações, Configurações |

---

### 4.10 Endereços

**Rota:** `/minha-conta/enderecos`

![Screenshot: Endereços](docs/screenshots/enderecos.png)
> *Lista de endereços salvos com opções de editar, definir padrão e excluir*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Listagem** | Cards de endereços com label, endereço completo e badge "Padrão" |
| **Novo Endereço** | Modal com formulário completo (label, destinatário, CEP, rua, número, complemento, bairro, cidade, UF) |
| **Auto-fill de CEP** | Busca automática via ViaCEP |
| **Definir Padrão** | Botão para tornar endereço padrão |
| **Excluir** | Confirmação via AlertDialog antes de remover |
| **Edição** | Modal pré-preenchido com dados existentes |

---

### 4.11 Formas de Pagamento

**Rota:** `/minha-conta/pagamentos`

![Screenshot: Pagamentos](docs/screenshots/pagamentos.png)
> *Lista de formas de pagamento com ícone, nome e opções de gerenciamento*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Listagem** | Cards com ícone do tipo, label, últimos 4 dígitos e badge "Padrão" |
| **Tipos Suportados** | Crédito, Débito, PIX, Boleto |
| **Detecção de Bandeira** | Regex para Visa, Mastercard, Elo, American Express, Discover |
| **Novo Pagamento** | Modal com seleção de tipo e campos dinâmicos |
| **Definir Padrão** | Botão para tornar pagamento padrão |
| **Excluir** | Confirmação via AlertDialog antes de remover |

---

### 4.12 Favoritos

**Rota:** `/favoritos`

![Screenshot: Favoritos](docs/screenshots/favoritos.png)
> *Lista de produtos favoritados com botão de adicionar ao carrinho*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Lista de Desejos** | Grid de produtos favoritados |
| **Adicionar ao Carrinho** | Botão direto em cada card |
| **Remover** | Coração preenchido clicável para desfavoritar |
| **Persistência** | Dados salvos no Supabase (usuário logado) |

---

### 4.13 Combos Promocionais

**Rota:** Homepage (seção) + `/buscar?q=combo`

![Screenshot: Combos](docs/screenshots/combos.png)
> *Cards de combos com grid de imagens, preços e economia*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Grid de Imagens** | 2x2 com fotos dos itens do combo |
| **Preço Original** | Valor total com riscado |
| **Preço do Combo** | Valor com desconto em destaque |
| **Badge de Economia** | "Economize R$X" ou "Economize X%" |
| **Adicionar ao Carrinho** | 1 clique para adicionar todos os itens |

---

### 4.14 Newsletter

**Rota:** Homepage (seção final)

![Screenshot: Newsletter](docs/screenshots/newsletter.png)
> *Seção de newsletter com gradiente premium, campo de e-mail e botão cadastrar*

#### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Cadastro de E-mail** | Campo com validação e botão "Cadastrar" |
| **Persistência** | Salvo no Supabase `newsletter_subscribers` |
| **Deteção de Duplicata** | Mensagem "Este e-mail já está cadastrado" |
| **Privacidade** | Nota "Ao se cadastrar, concorda com nossa Política de Privacidade" |

---

## 5. Design System

### 5.1 Paleta de Cores

| Cor | Uso | Hex |
|-----|-----|-----|
| **Primária** | Botões, links, badges, destaque | `#16a34a` (verde) |
| **Background** | Fundo da página | `#ffffff` |
| **Card** | Fundo de cards e seções | `#ffffff` |
| **Foreground** | Texto principal | `#09090b` (zinc-950) |
| **Muted** | Texto secundário, bordas | `#a1a1aa` (zinc-400) |
| **Destructive** | Erros, exclusões | `#ef4444` (vermelho) |

### 5.2 Tipografia

| Elemento | Estilo |
|----------|--------|
| **Títulos** | Font-black (900), tracking-tight |
| **Subtítulos** | Font-semibold (600), text-muted-foreground |
| **Corpo** | Font-normal (400), text-sm |
| **Badges** | Font-bold (700), text-[10px], uppercase |

### 5.3 Bordas e Sombras

| Elemento | Estilo |
|----------|--------|
| **Cards** | `rounded border border-border/40 bg-card` |
| **Cards Admin** | `rounded-xl` |
| **Botões** | `rounded-lg` |
| **Hover** | `hover:shadow-card-hover hover:border-primary/30` |

### 5.4 Responsividade

| Breakpoint | Largura | Comportamento |
|------------|---------|---------------|
| **Mobile** | `< 640px` | Layout single-column, menus hamburger |
| **Tablet** | `640px - 1024px` | Grid 2 colunas |
| **Desktop** | `> 1024px` | Layout completo, sidebar sticky |

---

## 6. Infraestrutura Técnica

### 6.1 Deploy

| Aspecto | Detalhe |
|---------|---------|
| **Plataforma** | Vercel |
| **URL** | https://e-commercepbrnfoods.vercel.app |
| **Build** | Automático a cada push no `main` |
| **Preview** | Branch previews automáticos |

### 6.2 Performance

| Métrica | Valor |
|---------|-------|
| **Cache TTL** | 5 minutos (React Query staleTime) |
| **Garbage Collection** | 10 minutos (React Query gcTime) |
| **Retry** | Backoff exponencial com máximo de tentativas |
| **Lazy Loading** | Rotas admin com code splitting |

### 6.3 Segurança

| Camada | Medida |
|--------|--------|
| **Autenticação** | Supabase Auth com JWT |
| **Senhas** | bcrypt (10 rounds) |
| **RLS** | Row-Level Security em todas tabelas |
| **Sanitização** | DOMPurify para HTML customizado |
| **Rate Limiting** | Client-side para login/reset |
| **CSP** | Content-Security-Policy via Vercel |
| **Monitoring** | Sentry para erros em tempo real |

### 6.4 Banco de Dados (Supabase)

| Tabela | Propósito |
|--------|-----------|
| `profiles` | Dados do usuário (nome, email, documento) |
| `products` | Catálogo de produtos |
| `categories` | Categorias de produtos |
| `brands` | Marcas parceiras |
| `orders` | Pedidos realizados |
| `order_items` | Itens de cada pedido |
| `stock_movements` | Histórico de movimentação de estoque |
| `customer_addresses` | Endereços salvos pelo cliente |
| `customer_payment_methods` | Formas de pagamento salvas |
| `product_reviews` | Avaliações de produtos |
| `combos` + `combo_items` | Combos promocionais |
| `coupons` | Cupons de desconto |
| `banners` | Banners do carrossel |
| `distributors` | Distribuidoras |
| `newsletter_subscribers` | Assinantes da newsletter |
| `cart_items` | Carrinho persistente |
| `wishlist_items` | Lista de desejos persistente |
| `store_config` | Configurações da loja |

---

## 7. Métricas e KPIs

### 7.1 Métricas de Conversão

| Métrica | Descrição |
|---------|-----------|
| **Taxa de Conversão** | Pedidos / Visitantes únicos |
| **Ticket Médio** | Valor médio por pedido |
| **Carrinho Abandonado** | Carrinhos criados / Pedidos finalizados |
| **Tempo até Compra** | Tempo médio entre primeira visita e primeiro pedido |

### 7.2 Métricas de Engajamento

| Métrica | Descrição |
|---------|-----------|
| **Produtos por Sessão** | Média de itens visualizados por visita |
| **Taxa de Busca** | Visitantes que usam a busca |
| **Taxa de Favoritos** | Produtos favoritados / Produtos visualizados |
| **Taxa de Assinatura Newsletter** | Cadastros / Visitantes únicos |

### 7.3 Métricas de Retenção

| Métrica | Descrição |
|---------|-----------|
| **Taxa de Retorno** | Clientes que retornam em 30 dias |
| **Frequência de Compra** | Pedidos por cliente por mês |
| **Lifetime Value** | Valor total gasto por cliente |
| **NPS** | Índice de satisfação do cliente |

### 7.4 Métricas Técnicas

| Métrica | Descrição |
|---------|-----------|
| **Uptime** | Disponibilidade da plataforma |
| **Tempo de Carregamento** | LCP (Largest Contentful Paint) |
| **Taxa de Erro** | Erros 5xx / Total de requisições |
| **Latência API** | Tempo médio de resposta do Supabase |

---

<div align="center">

---

**PB&RN Foods** — Distribuidora de Alimentos para o Seu Negócio

*Documento gerado em Julho de 2026*

</div>
