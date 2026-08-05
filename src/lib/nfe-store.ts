import type { NfeConfig, NotaFiscal, ProductFiscal } from "./types";

const LS_CONFIG_KEY = "@pbrn-nfe-config";
const LS_NOTAS_KEY = "@pbrn-notas-fiscais";

// ============================================================
// DEFAULT CONFIG (mock)
// ============================================================
const defaultConfig: NfeConfig = {
  cnpj: "00.000.000/0001-00",
  razaoSocial: "PB&RN Foods Ltda",
  nomeFantasia: "PB&RN Foods",
  ie: "000000000",
  im: "",
  crt: "3",
  endereco: {
    rua: "Rua Exemplo",
    numero: "123",
    bairro: "Centro",
    cidade: "João Pessoa",
    uf: "PB",
    cep: "58000-000",
  },
  telefone: "(83) 99999-9999",
  emailNfe: "nfe@pbrnfoods.com.br",
  serie: 1,
  proximoNumero: 1,
};

// ============================================================
// IN-MEMORY CACHE
// ============================================================
let _config: NfeConfig | null = null;
let _notas: NotaFiscal[] = [];
let _initialized = false;

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

function loadFromLs(): void {
  if (_initialized) return;
  _initialized = true;
  const storedConfig = lsGet<NfeConfig>(LS_CONFIG_KEY);
  if (storedConfig) _config = storedConfig;
  const storedNotas = lsGet<NotaFiscal[]>(LS_NOTAS_KEY);
  if (storedNotas) _notas = storedNotas;
}

function persistConfig(): void {
  lsSet(LS_CONFIG_KEY, _config);
}

function persistNotas(): void {
  lsSet(LS_NOTAS_KEY, _notas);
}

// ============================================================
// CONFIG
// ============================================================
export function getNfeConfig(): NfeConfig {
  if (!_initialized) loadFromLs();
  return _config || { ...defaultConfig };
}

export function saveNfeConfig(config: NfeConfig): void {
  _config = config;
  persistConfig();
}

export function isNfeConfigured(): boolean {
  if (!_initialized) loadFromLs();
  if (!_config) return false;
  return _config.cnpj.replace(/\D/g, "").length === 14 && _config.ie.length > 0;
}

// ============================================================
// NOTAS FISCAIS
// ============================================================
export function loadNotas(): NotaFiscal[] {
  if (!_initialized) loadFromLs();
  return _notas;
}

export function getNotaById(id: string): NotaFiscal | undefined {
  if (!_initialized) loadFromLs();
  return _notas.find((n) => n.id === id);
}

export function getNotaByOrderId(orderId: string): NotaFiscal | undefined {
  if (!_initialized) loadFromLs();
  return _notas.find((n) => n.orderId === orderId);
}

export function saveNota(nota: NotaFiscal): void {
  if (!_initialized) loadFromLs();
  const idx = _notas.findIndex((n) => n.id === nota.id);
  if (idx >= 0) _notas[idx] = nota;
  else _notas.push(nota);
  persistNotas();
}

export function deleteNota(id: string): void {
  if (!_initialized) loadFromLs();
  _notas = _notas.filter((n) => n.id !== id);
  persistNotas();
}

export function cancelNota(id: string): void {
  if (!_initialized) loadFromLs();
  const nota = _notas.find((n) => n.id === id);
  if (nota) {
    nota.status = "cancelada";
    persistNotas();
  }
}

export function incrementProximoNumero(): number {
  if (!_initialized) loadFromLs();
  if (!_config) _config = { ...defaultConfig };
  const numero = _config.proximoNumero;
  _config.proximoNumero++;
  persistConfig();
  return numero;
}

// ============================================================
// DADOS FISCAIS DOS PRODUTOS (mock — em produção viria do Supabase)
// ============================================================
const LS_PRODUCTS_FISCAL_KEY = "@pbrn-products-fiscal";
let _productsFiscal: Map<string, ProductFiscal> = new Map();
let _productsFiscalLoaded = false;

function loadProductsFiscal(): void {
  if (_productsFiscalLoaded) return;
  _productsFiscalLoaded = true;
  const stored = lsGet<Record<string, ProductFiscal>>(LS_PRODUCTS_FISCAL_KEY);
  if (stored) {
    _productsFiscal = new Map(Object.entries(stored));
  }
}

function persistProductsFiscal(): void {
  const obj = Object.fromEntries(_productsFiscal);
  lsSet(LS_PRODUCTS_FISCAL_KEY, obj);
}

export function getProductFiscal(productId: string): ProductFiscal | undefined {
  loadProductsFiscal();
  return _productsFiscal.get(productId);
}

export function saveProductFiscal(productId: string, data: ProductFiscal): void {
  loadProductsFiscal();
  _productsFiscal.set(productId, data);
  persistProductsFiscal();
}

export function getAllProductsFiscal(): Map<string, ProductFiscal> {
  loadProductsFiscal();
  return _productsFiscal;
}
