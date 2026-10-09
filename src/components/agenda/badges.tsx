import {
  AlarmClock,
  Bell,
  CalendarClock,
  CheckSquare,
  FileText,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType, Company, CompanyColor, Priority, Status } from "@/lib/agenda/types";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/agenda/types";

export const COMPANY_STYLES: Record<CompanyColor, { dot: string; soft: string; text: string; border: string; bg: string }> = {
  solidez: {
    dot: "bg-teal-600",
    soft: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800/80",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-l-teal-600",
    bg: "bg-teal-600",
  },
  mr: {
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-l-amber-500",
    bg: "bg-amber-500",
  },
  ramac: {
    dot: "bg-orange-600",
    soft: "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-l-orange-600",
    bg: "bg-orange-600",
  },
  plp: {
    dot: "bg-indigo-600",
    soft: "bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/80",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-l-indigo-600",
    bg: "bg-indigo-600",
  },
  personal: {
    dot: "bg-slate-500",
    soft: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-l-slate-400",
    bg: "bg-slate-500",
  },
};

export const TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  tarea: CheckSquare,
  reunion: Users,
  cita: CalendarClock,
  recordatorio: Bell,
  nota: FileText,
  vencimiento: AlarmClock,
};

export function CompanyBadge({ company, className = "" }: { company?: Company | null; className?: string }) {
  const color: CompanyColor = company?.color ?? "personal";
  const s = COMPANY_STYLES[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.soft} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {company ? company.name : "Personal"}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  baja: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  media: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/80",
  alta: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80",
  urgente: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/80 font-bold",
};

export function PriorityBadge({ priority, className = "" }: { priority: Priority; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]} ${className}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

const STATUS_STYLES: Record<Status, string> = {
  pendiente: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  en_progreso: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80",
  completada: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80",
};

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TypeBadge({ type, className = "" }: { type: ActivityType; className?: string }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>
      <Icon className="size-3.5" />
      {TYPE_LABELS[type]}
    </span>
  );
}

export function Avatar({
  name,
  initials,
  size = "sm",
  className = "",
}: {
  name: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-7 text-[11px]",
    md: "size-9 text-xs",
    lg: "size-12 text-sm",
  };
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#1b2640] font-bold text-white shadow-xs ${sizes[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
