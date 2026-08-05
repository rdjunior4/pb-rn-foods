import type { NfeConfig, NfeItemFiscal, NotaFiscal, NfeStatus, Order, OrderItem, Product, ProductFiscal } from "./types";

// ============================================================
// GERAÇÃO DE CHAVE DE ACESSO (44 dígitos)
// Formato: UF(2) + AAMM(4) + CNPJ(14) + MODELO(2) + SERIE(3) + NUMERO(9) + CODIGO(1) + NUMERO_ALEATORIO(4)
// ============================================================
export function gerarChaveAcesso(config: NfeConfig, numero: number, serie: number): string {
  const ufCodigo = ufParaCodigo(config.endereco.uf);
  const now = new Date();
  const aamm = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, "0");
  const cnpj = config.cnpj.replace(/\D/g, "");
  const modelo = "55";
  const serieStr = String(serie).padStart(3, "0");
  const numeroStr = String(numero).padStart(9, "0");
  const randomico = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  const base = ufCodigo + aamm + cnpj + modelo + serieStr + numeroStr;
  const digito = calcularDigitoVerificador(base);

  return base + digito + randomico;
}

function ufParaCodigo(uf: string): string {
  const map: Record<string, string> = {
    AC: "12", AL: "27", AM: "13", AP: "16", BA: "29", CE: "23",
    DF: "53", ES: "32", GO: "52", MA: "21", MG: "31", MS: "50",
    MT: "51", PA: "15", PB: "25", PE: "26", PI: "22", PR: "41",
    RJ: "33", RN: "24", RO: "11", RR: "14", RS: "43", SC: "42",
    SE: "28", SP: "35", TO: "17",
  };
  return map[uf.toUpperCase()] || "35";
}

function calcularDigitoVerificador(base: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  for (let i = base.length - 1; i >= 0; i--) {
    const peso = pesos[(base.length - 1 - i) % pesos.length];
    soma += parseInt(base[i]) * peso;
  }
  const resto = soma % 11;
  return resto < 2 ? "0" : String(11 - resto);
}

// ============================================================
// CÁLCULO DE IMPOSTOS (simplificado para Simples Nacional)
// ============================================================
export function calcularImpostos(
  items: OrderItem[],
  products: Map<string, Product & Partial<ProductFiscal>>,
): { items: NfeItemFiscal[]; totalIcms: number; totalPis: number; totalCofins: number; totalProdutos: number; totalPesoLiq: number; totalPesoBruto: number } {
  const nfeItems: NfeItemFiscal[] = [];
  let totalIcms = 0;
  let totalPis = 0;
  let totalCofins = 0;
  let totalProdutos = 0;
  let totalPesoLiq = 0;
  let totalPesoBruto = 0;

  for (const item of items) {
    const product = products.get(item.productId);
    const ncm = product?.ncm || "2106.90.90";
    const cfop = product?.cfopPadrao || "6102";
    const unidade = product?.unit || "UN";
    const pesoLiq = product?.pesoLiquido || 0;
    const pesoBruto = product?.pesoBruto || 0;

    const icmsAliquota = product?.icmsAliquota || 0;
    const pisAliquota = product?.pisAliquota || 1.65;
    const cofinsAliquota = product?.cofinsAliquota || 7.6;

    const valorTotal = item.quantity * item.price;
    const valorIcms = valorTotal * (icmsAliquota / 100);
    const valorPis = valorTotal * (pisAliquota / 100);
    const valorCofins = valorTotal * (cofinsAliquota / 100);

    nfeItems.push({
      produtoId: item.productId,
      nome: item.productName,
      ncm: ncm.replace(/\D/g, ""),
      cfop,
      unidade,
      quantidade: item.quantity,
      valorUnitario: item.price,
      valorTotal,
      pesoLiquido: pesoLiq * item.quantity,
      pesoBruto: pesoBruto * item.quantity,
      icms: { cst: product?.icmsCst || "00", aliquota: icmsAliquota, valor: valorIcms },
      pis: { cst: product?.pisCst || "01", aliquota: pisAliquota, valor: valorPis },
      cofins: { cst: product?.cofinsCst || "01", aliquota: cofinsAliquota, valor: valorCofins },
    });

    totalIcms += valorIcms;
    totalPis += valorPis;
    totalCofins += valorCofins;
    totalProdutos += valorTotal;
    totalPesoLiq += pesoLiq * item.quantity;
    totalPesoBruto += pesoBruto * item.quantity;
  }

  return { items: nfeItems, totalIcms, totalPis, totalCofins, totalProdutos, totalPesoLiq, totalPesoBruto };
}

// ============================================================
// GERAÇÃO DE NF-e (mock — simula envio à SEFAZ)
// ============================================================
export function emitirNfe(
  config: NfeConfig,
  order: Order,
  items: NfeItemFiscal[],
  totals: { totalProdutos: number; totalIcms: number; totalPis: number; totalCofins: number },
  observacoes?: string,
): NotaFiscal {
  const numero = config.proximoNumero;
  const serie = config.serie;
  const chave = gerarChaveAcesso(config, numero, serie);
  const protocolo = String(Math.floor(Math.random() * 90000000000000) + 100000000000000);

  const enderecoDest = order.shippingAddress;

  return {
    id: crypto.randomUUID(),
    orderId: order.id,
    numero,
    serie,
    chaveAcesso: chave,
    protocolo,
    status: "autorizada",
    emitente: config,
    destinatario: {
      nome: order.customerName,
      cnpj: order.customerDocument.replace(/\D/g, ""),
      ie: "ISENTO",
      endereco: enderecoDest,
      telefone: order.customerPhone || "",
      email: order.customerEmail,
    },
    items,
    valorProdutos: totals.totalProdutos,
    valorFrete: order.shippingCost,
    valorDesconto: order.discount,
    valorTotal: order.total,
    valorIcms: totals.totalIcms,
    valorPis: totals.totalPis,
    valorCofins: totals.totalCofins,
    dataEmissao: new Date().toISOString(),
    dataAutorizacao: new Date().toISOString(),
    observacoes,
  };
}

// ============================================================
// FORMATAÇÃO
// ============================================================
export function formatNfeNumero(numero: number, serie: number): string {
  return `${String(numero).padStart(3, "0")}/S${serie}`;
}

export function formatChaveAcesso(chave: string): string {
  return chave.replace(/(\d{4})/g, "$1 ").trim();
}

export function formatNfeStatus(status: NfeStatus): { label: string; color: string } {
  const map: Record<NfeStatus, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
    autorizada: { label: "Autorizada", color: "bg-emerald-100 text-emerald-700" },
    cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
    inutilizada: { label: "Inutilizada", color: "bg-zinc-100 text-zinc-500" },
  };
  return map[status];
}

// ============================================================
// LISTAS DE REFERÊNCIA
// ============================================================
export const NCM_OPTIONS = [
  { value: "2202.10.00", label: "2202.10.00 — Refrigerantes e bebidas não alcoólicas" },
  { value: "2203.00.00", label: "2203.00.00 — Cervejas" },
  { value: "2204.21.00", label: "2204.21.00 — Vinhos de uvas frescas" },
  { value: "1701.14.00", label: "1701.14.00 — Açúcar de cana" },
  { value: "1905.31.00", label: "1905.31.00 — Biscoitos e bolachas" },
  { value: "1806.32.00", label: "1806.32.00 — Chocolate em barras" },
  { value: "3402.20.00", label: "3402.20.00 — Detergentes e sabões" },
  { value: "3305.10.00", label: "3305.10.00 — Shampoos" },
  { value: "3004.90.90", label: "3004.90.90 — Medicamentos" },
  { value: "2106.90.90", label: "2106.90.90 — Outros produtos alimentícios" },
  { value: "0901.11.10", label: "0901.11.10 — Café torrado em grãos" },
  { value: "0402.10.10", label: "0402.10.10 — Leite em pó" },
  { value: "1517.10.00", label: "1517.10.00 — Margarina" },
  { value: "0713.33.10", label: "0713.33.10 — Feijão" },
  { value: "1006.30.00", label: "1006.30.00 — Arroz" },
];

export const CFOP_OPTIONS = [
  { value: "6101", label: "6101 — Venda de produção dentro do estado" },
  { value: "6102", label: "6102 — Venda de mercadoria dentro do estado" },
  { value: "6105", label: "6105 — Venda de produção fora do estado" },
  { value: "6106", label: "6106 — Venda de mercadoria fora do estado" },
  { value: "5101", label: "5101 — Venda de produção dentro do estado (ind.)" },
  { value: "5102", label: "5102 — Venda de mercadoria dentro do estado (ind.)" },
  { value: "1101", label: "1101 — Compra para industrialização dentro do estado" },
  { value: "1102", label: "1102 — Compra para comercialização dentro do estado" },
  { value: "2101", label: "2101 — Compra para industrialização fora do estado" },
  { value: "2102", label: "2102 — Compra para comercialização fora do estado" },
];

export const CST_ICMS_OPTIONS = [
  { value: "00", label: "00 — Tributado integralmente" },
  { value: "10", label: "10 — Tributado com ST" },
  { value: "20", label: "20 — Tributado com redução de base" },
  { value: "30", label: "30 — Isento com ST" },
  { value: "40", label: "40 — Isento" },
  { value: "41", label: "41 — Não tributado" },
  { value: "50", label: "50 — Suspensão" },
  { value: "60", label: "60 — ICMS cobrado anteriormente (ST)" },
  { value: "70", label: "70 — Complemento" },
  { value: "90", label: "90 — Outros" },
];

export const CST_PIS_COFINS_OPTIONS = [
  { value: "01", label: "01 — Cumulativo" },
  { value: "02", label: "02 — Não cumulativo" },
  { value: "04", label: "04 — Isento" },
  { value: "06", label: "06 — Suspensão" },
  { value: "07", label: "07 — Sem incidência" },
  { value: "08", label: "08 — Outros" },
  { value: "09", label: "09 — Operação sem crédito" },
];

export const ORIGEM_MERCADORIA_OPTIONS = [
  { value: 0, label: "0 — Nacional" },
  { value: 1, label: "1 — Estrangeira (importação direta)" },
  { value: 2, label: "2 — Estrangeira (adquirida no mercado interno)" },
  { value: 3, label: "3 — Nacional com importação > 40%" },
  { value: 4, label: "4 — Nacional com processos produtivos básicos" },
  { value: 5, label: "5 — Nacional com importação <= 40%" },
  { value: 6, label: "6 — Estrangeira (importação direta, sem Similar Nacional)" },
  { value: 7, label: "7 — Estrangeira (mercado interno, sem Similar Nacional)" },
  { value: 8, label: "8 — Nacional com importação > 70%" },
];
