import type { OrderStatus } from "./types";

/* ─── Status de pedido ─── */
export const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  pending: { label: "Pendente", color: "text-amber-700", dot: "bg-amber-500", bg: "bg-amber-50" },
  confirmed: { label: "Confirmado", color: "text-blue-700", dot: "bg-blue-500", bg: "bg-blue-50" },
  preparing: {
    label: "Separando",
    color: "text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50",
  },
  shipped: {
    label: "Em trânsito",
    color: "text-indigo-700",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50",
  },
  delivered: {
    label: "Entregue",
    color: "text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
  },
  cancelled: { label: "Cancelado", color: "text-red-700", dot: "bg-red-500", bg: "bg-red-50" },
};

export const statusSteps: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

/* ─── Transportadoras ─── */
export const carriers = [
  { id: "propria", name: "Entrega própria", days: "Conforme região" },
  { id: "retirada", name: "Retirada no local", days: "Imediata" },
];

export const ZERO_FEE_CARRIERS = ["propria", "retirada"];

/* ─── Unidades de produto ─── */
export const unitLabels: Record<string, string> = {
  un: "Unidade",
  kg: "Quilograma (kg)",
  fd: "Fardo",
  pc: "Pacote",
};

/* ─── Paginação ─── */
export const ITEMS_PER_PAGE = 12;
export const ITEMS_PER_PAGE_ADMIN = 10;

/* ─── Imagens ─── */
export const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+imagem";
export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

/* ─── Select classes padronizadas ─── */
export const SELECT_CLASSES = {
  admin: "w-full rounded-lg border border-zinc-200 bg-white pl-3.5 pr-8 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem] [&::-webkit-calendar-picker-wrapper]:hidden",
  public: "rounded-lg border border-border/40 bg-card pl-3.5 pr-8 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]",
  compact: "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]",
} as const;
