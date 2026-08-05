import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileText, Search, Eye, XCircle, Download, Filter,
  ChevronLeft, ChevronRight, MoreHorizontal, Settings, CheckCircle, Clock,
} from "lucide-react";
import { formatNfeNumero, formatNfeStatus } from "@/lib/nfe-utils";
import { loadNotas, cancelNota, getNfeConfig } from "@/lib/nfe-store";
import { formatCurrency, formatDate } from "@/lib/format";
import { NfeBadge } from "@/components/admin/NfeBadge";
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
import type { NotaFiscal, NfeStatus } from "@/lib/types";

const ITEMS_PER_PAGE = 10;

export const Route = createFileRoute("/admin/nfe")({
  component: AdminNfe,
});

function AdminNfe() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NfeStatus | "">("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const notas = useMemo(() => loadNotas(), []);

  const filtered = useMemo(() => {
    let result = [...notas];
    if (statusFilter) result = result.filter((n) => n.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          String(n.numero).includes(q) ||
          n.destinatario.nome.toLowerCase().includes(q) ||
          n.destinatario.cnpj.includes(q) ||
          n.orderId.toLowerCase().includes(q) ||
          n.chaveAcesso.includes(q),
      );
    }
    return result.sort((a, b) => b.numero - a.numero);
  }, [notas, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const autorizadas = notas.filter((n) => n.status === "autorizada").length;
    const canceladas = notas.filter((n) => n.status === "cancelada").length;
    const valorTotal = notas.filter((n) => n.status === "autorizada").reduce((s, n) => s + n.valorTotal, 0);
    return { total: notas.length, autorizadas, canceladas, valorTotal };
  }, [notas]);

  const config = getNfeConfig();

  const handleCancel = () => {
    if (cancelId) {
      cancelNota(cancelId);
      setCancelId(null);
    }
  };

  const selectedNota = selectedId ? notas.find((n) => n.id === selectedId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Notas Fiscais</h1>
          <p className="text-sm text-zinc-500 mt-1">Emissão e gestão de NF-e</p>
        </div>
        <Link
          to="/admin/nfe/config"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Config. Fiscal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-zinc-600" },
          { label: "Autorizadas", value: stats.autorizadas, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Canceladas", value: stats.canceladas, icon: XCircle, color: "text-red-500" },
          { label: "Valor Total", value: formatCurrency(stats.valorTotal), icon: FileText, color: "text-primary", isCurrency: true },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
                <div className={`font-bold ${s.isCurrency ? "text-base" : "text-lg"} text-zinc-900`}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Config warning */}
      {!config.cnpj || config.cnpj === "00.000.000/0001-00" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Settings className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Configure os dados fiscais da empresa</p>
            <p className="text-xs text-amber-600">Antes de emitir NF-e, preencha os dados da empresa em Config. Fiscal.</p>
          </div>
          <Link to="/admin/nfe/config" className="text-xs font-semibold text-amber-700 hover:text-amber-800 whitespace-nowrap">
            Configurar →
          </Link>
        </div>
      ) : null}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por número, cliente, CNPJ..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as NfeStatus | ""); setPage(1); }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">Todos os status</option>
            <option value="autorizada">Autorizada</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
            <option value="inutilizada">Inutilizada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhuma nota fiscal encontrada</p>
          <p className="text-xs text-zinc-400 mt-1">
            {notas.length === 0 ? "Emita sua primeira NF-e a partir de um pedido" : "Tente ajustar os filtros"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider">NF-e</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Pedido</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 text-xs uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((nota) => (
                  <tr key={nota.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{formatNfeNumero(nota.numero, nota.serie)}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{nota.chaveAcesso.slice(0, 20)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 truncate max-w-[180px]">{nota.destinatario.nome}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{nota.destinatario.cnpj}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-zinc-600 font-mono text-xs">{nota.orderId}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{formatCurrency(nota.valorTotal)}</td>
                    <td className="px-4 py-3"><NfeBadge status={nota.status} compact /></td>
                    <td className="px-4 py-3 text-xs text-zinc-500 hidden sm:table-cell">{formatDate(nota.dataEmissao)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedId(nota.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {nota.status === "autorizada" && (
                          <button
                            onClick={() => setCancelId(nota.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Cancelar NF-e"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
              <span className="text-xs text-zinc-500">
                {filtered.length} {filtered.length === 1 ? "nota" : "notas"} — Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        p === page ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50 border border-zinc-200"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {selectedNota && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                NF-e {formatNfeNumero(selectedNota.numero, selectedNota.serie)}
              </h2>
              <button onClick={() => setSelectedId(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <NfeBadge status={selectedNota.status} numero={selectedNota.numero} />
                {selectedNota.protocolo && (
                  <span className="text-xs text-zinc-500">Protocolo: {selectedNota.protocolo}</span>
                )}
              </div>

              {/* Emitente */}
              <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Emitente</h3>
                <div className="text-sm font-medium text-zinc-900">{selectedNota.emitente.razaoSocial}</div>
                <div className="text-xs text-zinc-500">CNPJ: {selectedNota.emitente.cnpj} | IE: {selectedNota.emitente.ie}</div>
                <div className="text-xs text-zinc-500">
                  {selectedNota.emitente.endereco.rua}, {selectedNota.emitente.endereco.numero} — {selectedNota.emitente.endereco.bairro}, {selectedNota.emitente.endereco.cidade}/{selectedNota.emitente.endereco.uf}
                </div>
              </div>

              {/* Destinatário */}
              <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Destinatário</h3>
                <div className="text-sm font-medium text-zinc-900">{selectedNota.destinatario.nome}</div>
                <div className="text-xs text-zinc-500">CNPJ: {selectedNota.destinatario.cnpj} | IE: {selectedNota.destinatario.ie}</div>
                <div className="text-xs text-zinc-500">{selectedNota.destinatario.endereco}</div>
              </div>

              {/* Itens */}
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Produtos</h3>
                </div>
                <div className="divide-y divide-zinc-100">
                  {selectedNota.items.map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">{item.nome}</div>
                        <div className="text-[11px] text-zinc-400">
                          {item.quantidade}x {formatCurrency(item.valorUnitario)} | NCM: {item.ncm} | CFOP: {item.cfop}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 shrink-0">{formatCurrency(item.valorTotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Produtos</span><span className="text-zinc-900">{formatCurrency(selectedNota.valorProdutos)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Frete</span><span className="text-zinc-900">{formatCurrency(selectedNota.valorFrete)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Desconto</span><span className="text-red-500">-{formatCurrency(selectedNota.valorDesconto)}</span></div>
                <div className="flex justify-between text-sm border-t border-zinc-200 pt-2"><span className="font-bold text-zinc-900">Total NF-e</span><span className="font-bold text-zinc-900">{formatCurrency(selectedNota.valorTotal)}</span></div>
                <div className="border-t border-zinc-200 pt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">ICMS</span><span className="text-zinc-700">{formatCurrency(selectedNota.valorIcms)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">PIS</span><span className="text-zinc-700">{formatCurrency(selectedNota.valorPis)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">COFINS</span><span className="text-zinc-700">{formatCurrency(selectedNota.valorCofins)}</span></div>
                </div>
              </div>

              {/* Chave de acesso */}
              <div className="rounded-lg border border-zinc-200 p-4">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chave de Acesso</h3>
                <p className="text-xs font-mono text-zinc-700 break-all">{selectedNota.chaveAcesso}</p>
              </div>

              {/* Observações */}
              {selectedNota.observacoes && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Observações</h3>
                  <p className="text-sm text-zinc-700">{selectedNota.observacoes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-zinc-800 transition-colors">
                  <Download className="h-4 w-4" />
                  Baixar DANFE
                </button>
                {selectedNota.status === "autorizada" && (
                  <button
                    onClick={() => { setCancelId(selectedNota.id); setSelectedId(null); }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Cancelar NF-e
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta nota fiscal? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-500 hover:bg-red-600">
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
