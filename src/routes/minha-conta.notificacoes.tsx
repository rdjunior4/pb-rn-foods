import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronLeft, Check, CheckCheck, Trash2, Package, Tag, AlertTriangle, Info, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@/lib/hooks";
import type { NotificationType } from "@/lib/types";
import { toast } from "sonner";
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
import { useState } from "react";

export const Route = createFileRoute("/minha-conta/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações | PB&RN Foods" },
      { name: "description", content: "Veja suas notificacoes de pedidos e ofertas na PB&RN Foods." },
    ],
  }),
  component: NotificationsPage,
});

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: typeof Bell; color: string }> = {
  order_update: { label: "Pedido", icon: Package, color: "bg-blue-50 text-blue-600" },
  promo: { label: "Promocao", icon: Tag, color: "bg-amber-50 text-amber-600" },
  stock_alert: { label: "Estoque", icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
  system: { label: "Sistema", icon: Info, color: "bg-zinc-50 text-zinc-600" },
};

function NotificationsPage() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const { data: notifications = [], isLoading } = useNotifications(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesse sua conta</h2>
          <p className="text-sm text-muted-foreground mb-6">Faca login para ver suas notificacoes.</p>
          <Link to="/minha-conta" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all">
            <LogIn className="h-4 w-4" /> Ir para Minha Conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="h-3 w-3" /> Minha conta
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Notificacoes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} nao lida${unreadCount > 1 ? "s" : ""}` : "Todas lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead.mutate(userId)} disabled={markAllRead.isPending} className="h-10 px-4 rounded-lg border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all inline-flex items-center gap-2">
            <CheckCheck className="h-4 w-4" /> Marcar todas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <Bell className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold mb-1">Nenhuma notificacao</p>
          <p className="text-xs text-muted-foreground">Quando houver novidades, elas aparecerao aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`group rounded-xl border p-4 transition-all cursor-pointer ${
                  n.read
                    ? "border-border/40 bg-card hover:border-border/60"
                    : "border-primary/20 bg-primary/5 hover:border-primary/30"
                }`}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                  if (n.link) window.location.href = n.link;
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-semibold truncate ${n.read ? "text-foreground" : "text-foreground"}`}>{n.title}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{relativeTime(n.createdAt)}</span>
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                    <span className={`inline-flex items-center text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Marcar como lida">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(n.id); }} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all" title="Remover">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover notificacao?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteNotif.mutate(deleteId); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
