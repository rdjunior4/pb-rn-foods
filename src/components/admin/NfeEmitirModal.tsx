import { useState, useMemo } from "react";
import {
  FileText, X, AlertTriangle, CheckCircle, Loader2,
  Store, User, Package, Calculator,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  calcularImpostos,
  emitirNfe,
  formatNfeNumero,
} from "@/lib/nfe-utils";
import {
  getNfeConfig,
  isNfeConfigured,
  saveNota,
  incrementProximoNumero,
  getProductFiscal,
} from "@/lib/nfe-store";
import { loadStore } from "@/lib/admin-store";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import type { Order, Product, ProductFiscal } from "@/lib/types";

interface NfeEmitirModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onEmitted?: () => void;
}

export function NfeEmitirModal({ open, onOpenChange, order, onEmitted }: NfeEmitirModalProps) {
  const [observacoes, setObservacoes] = useState("");
  const [step, setStep] = useState<"review" | "processing" | "done">("review");

  const config = getNfeConfig();
  const configured = isNfeConfigured();

  const products = useMemo(() => {
    const map = new Map<string, Product & Partial<ProductFiscal>>();
    const allProducts = loadStore().products;
    for (const p of allProducts) {
      const fiscal = getProductFiscal(p.id);
      map.set(p.id, { ...p, ...fiscal });
    }
    return map;
  }, []);

  const taxResult = useMemo(
    () => calcularImpostos(order.items, products),
    [order.items, products],
  );

  const handleEmit = async () => {
    setStep("processing");

    // Simula delay de processamento (em integração real, seria chamada à API)
    await new Promise((r) => setTimeout(r, 1500));

    const numero = incrementProximoNumero();
    const nota = emitirNfe(config, order, taxResult.items, {
      totalProdutos: taxResult.totalProdutos,
      totalIcms: taxResult.totalIcms,
      totalPis: taxResult.totalPis,
      totalCofins: taxResult.totalCofins,
    }, observacoes || undefined);

    saveNota(nota);
    setStep("done");

    toast.success(`NF-e ${formatNfeNumero(nota.numero, nota.serie)} emitida com sucesso!`);
    onEmitted?.();
  };

  const handleClose = () => {
    setStep("review");
    setObservacoes("");
    onOpenChange(false);
  };

  if (!configured) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Configuração Pendente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Configure os dados fiscais da empresa antes de emitir NF-e.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "review" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Emitir Nota Fiscal — {order.id}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Revise os dados abaixo antes de emitir a NF-e.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 my-4">
              {/* Emitente */}
              <div className="rounded-lg border border-zinc-200 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Emitente</span>
                </div>
                <div className="text-sm font-medium text-zinc-900">{config.razaoSocial}</div>
                <div className="text-xs text-zinc-500">CNPJ: {config.cnpj} | IE: {config.ie}</div>
              </div>

              {/* Destinatário */}
              <div className="rounded-lg border border-zinc-200 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Destinatário</span>
                </div>
                <div className="text-sm font-medium text-zinc-900">{order.customerName}</div>
                <div className="text-xs text-zinc-500">
                  {order.customerDocument ? `Doc: ${order.customerDocument}` : "Sem documento"} | {order.customerEmail}
                </div>
              </div>

              {/* Produtos */}
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Produtos ({order.items.length})</span>
                </div>
                <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                  {order.items.map((item, i) => {
                    const product = products.get(item.productId);
                    return (
                      <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 truncate">{item.productName}</div>
                          <div className="text-[11px] text-zinc-400">
                            {item.quantity}x {formatCurrency(item.price)} | NCM: {product?.ncm || "—"} | CFOP: {product?.cfopPadrao || "6102"}
                          </div>
                        </div>
                        <div className="font-semibold text-zinc-900 shrink-0">{formatCurrency(item.quantity * item.price)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tributos */}
              <div className="rounded-lg border border-zinc-200 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tributos (estimativa)</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-zinc-50 p-2">
                    <div className="text-[10px] text-zinc-500">ICMS</div>
                    <div className="text-sm font-bold text-zinc-900">{formatCurrency(taxResult.totalIcms)}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2">
                    <div className="text-[10px] text-zinc-500">PIS</div>
                    <div className="text-sm font-bold text-zinc-900">{formatCurrency(taxResult.totalPis)}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2">
                    <div className="text-[10px] text-zinc-500">COFINS</div>
                    <div className="text-sm font-bold text-zinc-900">{formatCurrency(taxResult.totalCofins)}</div>
                  </div>
                </div>
              </div>

              {/* Totais */}
              <div className="rounded-lg border border-zinc-200 p-3.5 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Produtos</span><span>{formatCurrency(taxResult.totalProdutos)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Frete</span><span>{formatCurrency(order.shippingCost)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Desconto</span><span className="text-red-500">-{formatCurrency(order.discount)}</span></div>}
                <div className="flex justify-between text-sm border-t border-zinc-200 pt-1.5"><span className="font-bold text-zinc-900">Total NF-e</span><span className="font-bold text-zinc-900">{formatCurrency(order.total)}</span></div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Observações (opcional)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais para a NF-e..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEmit} className="bg-zinc-900 hover:bg-zinc-800">
                <FileText className="h-4 w-4 mr-1.5" />
                Emitir NF-e
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">Emitindo nota fiscal...</p>
              <p className="text-xs text-zinc-500 mt-1">Enviando dados para processamento</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                NF-e Emitida com Sucesso!
              </AlertDialogTitle>
              <AlertDialogDescription>
                A nota fiscal foi autorizada pela SEFAZ e está disponível na lista de NF-e.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleClose} className="bg-zinc-900 hover:bg-zinc-800">
                Fechar
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
