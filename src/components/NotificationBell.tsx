import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Package, Tag, AlertTriangle, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/hooks";
import type { NotificationType } from "@/lib/types";

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  order_update: Package,
  promo: Tag,
  stock_alert: AlertTriangle,
  system: Info,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  order_update: "bg-blue-50 text-blue-600",
  promo: "bg-amber-50 text-amber-600",
  stock_alert: "bg-orange-50 text-orange-600",
  system: "bg-zinc-50 text-zinc-600",
};

export function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: unreadCount = 0 } = useUnreadNotificationCount(userId);
  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const recent = notifications.slice(0, 5);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notificacoes"
        className="relative h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-card rounded-xl border border-border/40 shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <span className="text-sm font-bold">Notificacoes</span>
            {unreadCount > 0 && (
              <button onClick={() => { if (userId) markAllRead.mutate(userId); setOpen(false); }} className="text-[11px] text-primary font-semibold hover:underline">
                Marcar todas lidas
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma notificacao</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
              {recent.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Info;
                const color = TYPE_COLORS[n.type] || TYPE_COLORS.system;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      if (!n.read) markRead.mutate(n.id);
                      if (n.link) window.location.href = n.link;
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        {n.message && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-border/40 text-center">
            <Link to="/minha-conta/notificacoes" onClick={() => setOpen(false)} className="text-xs text-primary font-semibold hover:underline">
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
