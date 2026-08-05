import { FileText, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import type { NfeStatus } from "@/lib/types";
import { formatNfeStatus } from "@/lib/nfe-utils";

export function NfeBadge({
  status,
  numero,
  onClick,
  compact = false,
}: {
  status: NfeStatus;
  numero?: number;
  onClick?: () => void;
  compact?: boolean;
}) {
  const { label, color } = formatNfeStatus(status);

  const icons: Record<NfeStatus, React.ReactNode> = {
    pendente: <Clock className="h-3 w-3" />,
    autorizada: <CheckCircle className="h-3 w-3" />,
    cancelada: <XCircle className="h-3 w-3" />,
    inutilizada: <Ban className="h-3 w-3" />,
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
        {icons[status]}
        NF-e
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:opacity-80 ${color}`}
    >
      <FileText className="h-3.5 w-3.5" />
      {numero ? `NF-e ${String(numero).padStart(3, "0")}` : "NF-e"}
      {icons[status]}
    </button>
  );
}
