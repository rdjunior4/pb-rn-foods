import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface StaticPage {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

let _pages: StaticPage[] = [
  {
    slug: "sobre",
    title: "Sobre nós",
    content: `## Quem somos

A **PB&RN Foods** é uma distribuidora de alimentos focada no mercado B2B (Business-to-Business), atendendo restaurantes, mercearias, lanchonetes e estabelecimentos comerciais em toda a região Nordeste.

## Nossa missão

Oferecer produtos de qualidade com preços justos e logística eficiente, garantindo que o seu negócio nunca fique sem abastecimento.

## Cobertura

Atuamos principalmente na Paraíba e no Rio Grande do Norte, com distribuidoras em João Pessoa, Campina Grande, Caicó e Natal. Nossa rede de entregas cobre dezenas de cidades em toda a região.

## Diferenciais

- **Compra no atacado** com preços especiais para CNPJ
- **Entrega rápida** em toda a região Nordeste
- **Variedade** de produtos e marcas selecionadas
- **Atendimento personalizado** para cada cliente`,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: "termos",
    title: "Termos e Condições",
    content: `## Termos de Uso

Ao utilizar a plataforma PB&RN Foods, você concorda com os termos abaixo.

## 1. Cadastro

O cadastro é gratuito e pode ser feito com CPF ou CNPJ. Para compras no atacado com preços especiais, é necessário CNPJ válido.

## 2. Pedidos

Todos os pedidos estão sujeitos à confirmação de estoque e disponibilidade. Em caso de indisponibilidade, o cliente será notificado e o valor reembolsado.

## 3. Pagamentos

Aceitamos cartão de crédito, boleto bancário e Pix. O processamento do pagamento ocorre após a confirmação do pedido.

## 4. Entregas

O prazo de entrega varia conforme a região. Frete grátis para a região Nordeste. Para demais regiões, o valor do frete será calculado no checkout.

## 5. Trocas e Devoluções

O cliente tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. Produtos perecíveis não podem ser devolvidos após abertura.

## 6. Privacidade

Seus dados são utilizados apenas para processamento de pedidos e comunicação relacionada. Não compartilhamos seus dados com terceiros sem consentimento.`,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: "faq",
    title: "Perguntas Frequentes",
    content: `## Perguntas Frequentes

### Como faço meu cadastro?

Clique em "Entrar" no topo do site e selecione a aba "Cadastre-se". Você pode se cadastrar com CPF ou CNPJ.

### Preciso de CNPJ para comprar?

Não. Você pode comprar com CPF, mas para acessar preços de atacado e condições especiais, é necessário CNPJ.

### Quais formas de pagamento são aceitas?

Aceitamos cartão de crédito, boleto bancário e Pix.

### Qual o prazo de entrega?

O prazo varia conforme sua localização. Pedidos na região Nordeste geralmente são entregues em 2-5 dias úteis.

### O frete é grátis?

Sim! Oferecemos frete grátis para toda a região Nordeste. Para outras regiões, o valor é calculado no checkout.

### Como rastrear meu pedido?

Após o login, acesse "Minha Conta" > "Meus Pedidos" para acompanhar o status em tempo real.

### Posso cancelar um pedido?

Sim, pedidos podem ser cancelados enquanto estiverem com status "Pendente" ou "Confirmado". Entre em contato pelo nosso telefone.

### Como funcionam os preços por volume?

Quanto mais você compra, menos paga por unidade. Os descontos progressivos aparecem automaticamente na página do produto.`,
    updatedAt: new Date().toISOString(),
  },
  {
    slug: "privacidade",
    title: "Política de Privacidade",
    content: `## Política de Privacidade

A PB&RN Foods respeita a privacidade dos seus usuários.

## Dados coletados

- **Dados de cadastro**: nome, e-mail, CPF/CNPJ, telefone
- **Dados de pedido**: endereço de entrega, forma de pagamento
- **Dados de navegação**: cookies de sessão e preferências

## Uso dos dados

Seus dados são utilizados exclusivamente para:
- Processamento e entrega de pedidos
- Comunicação sobre o status dos pedidos
- Melhoria dos nossos serviços

## Armazenamento

Os dados são armazenados de forma segura. Senhas são criptografadas e nunca compartilhadas.

## Seus direitos

Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco.`,
    updatedAt: new Date().toISOString(),
  },
];

export function loadPages(): StaticPage[] {
  return _pages;
}

export function savePages(pages: StaticPage[]): void {
  _pages = pages;
}

export function getPage(slug: string): StaticPage | null {
  return loadPages().find((p) => p.slug === slug) || null;
}

export function savePage(page: StaticPage): void {
  const pages = loadPages();
  const idx = pages.findIndex((p) => p.slug === page.slug);
  if (idx >= 0) pages[idx] = page;
  else pages.push(page);
  savePages(pages);
}

export function deletePage(slug: string): void {
  savePages(loadPages().filter((p) => p.slug !== slug));
}

// ============================================================
// SUPABASE SYNC
// ============================================================

let syncPromise: Promise<void> | null = null;

export async function syncPagesFromSupabase(): Promise<void> {
  if (syncPromise) return syncPromise;
  if (!isSupabaseConfigured()) return;

  syncPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data } = await supabase.from("pages").select("*");
      if (data && data.length > 0) {
        const pages: StaticPage[] = data.map((p: Record<string, unknown>) => ({
          slug: p.slug as string,
          title: p.title as string,
          content: p.content as string,
          updatedAt: p.updated_at as string,
        }));
        _pages = pages;
      }
    } catch (err) {
      console.error("[syncPagesFromSupabase] erro:", err);
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}
