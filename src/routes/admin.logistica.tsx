import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAdminOrders } from "@/lib/hooks";
import { carriers } from "@/lib/constants";
import {
  Truck,
  Clock,
  CheckCircle,
  Package,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/admin/logistica")({
  component: AdminLogistica,
});

function AdminLogistica() {
  const { data: orders = [] } = useAdminOrders();

  const stats = useMemo(() => {
    const withCarrier = orders.filter((o) => o.shippingCarrier);
    const withTracking = orders.filter((o) => o.trackingCode);
    const delivered = orders.filter((o) => o.status === "delivered");
    const avgDelivery = delivered.length;

    const byCarrier = carriers.map((c) => ({
      ...c,
      count: withCarrier.filter((o) => o.shippingCarrier === c.id).length,
    }));

    return { withCarrier: withCarrier.length, withTracking: withTracking.length, delivered: avgDelivery, byCarrier };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Logística</h1>
        <p className="text-sm text-zinc-500 mt-1">Transportadoras e configurações de envio</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{carriers.length}</div>
              <div className="text-xs text-zinc-400">Transportadoras</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.withCarrier}</div>
              <div className="text-xs text-zinc-400">Com transportadora</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.withTracking}</div>
              <div className="text-xs text-zinc-400">Com rastreio</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{stats.delivered}</div>
              <div className="text-xs text-zinc-400">Entregues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Carriers List */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-bold text-zinc-900">Transportadoras cadastradas</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pedidos são atribuídos automaticamente com base na localização
          </p>
        </div>
        <div className="divide-y divide-zinc-100">
          {stats.byCarrier.map((carrier) => (
            <div key={carrier.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{carrier.name}</div>
                <div className="text-xs text-zinc-400">
                  Prazo estimado: {carrier.days}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-zinc-900">{carrier.count}</div>
                <div className="text-[10px] text-zinc-400">pedidos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Como funciona</h3>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>• A transportadora é atribuída automaticamente com base na localização do cliente</li>
              <li>• O código de rastreio e previsão de entrega são configurados na página <strong>Pedidos</strong></li>
              <li>• O pipeline de acompanhamento (kanban) também está na página <strong>Pedidos</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
