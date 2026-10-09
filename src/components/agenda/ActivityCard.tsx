import { Check, Clock, Repeat, Share2 } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Activity } from "@/lib/agenda/types";
import { daysUntil, nextOccurrence, relativeLabel } from "@/lib/agenda/dates";
import { COMPANY_STYLES, CompanyBadge, PriorityBadge, StatusBadge, TYPE_ICONS } from "./badges";

export function ActivityCard({
  activity,
  compact = false,
  dateOverride,
  onClick,
}: {
  activity: Activity;
  compact?: boolean;
  dateOverride?: string;
  onClick?: () => void;
}) {
  const { companyById, userById, updateActivity, currentUser } = useAgenda();
  const company = companyById(activity.companyId);
  const owner = userById(activity.ownerId);
  const Icon = TYPE_ICONS[activity.type];
  const date = dateOverride ?? nextOccurrence(activity);
  const n = daysUntil(date);
  const done = activity.status === "completada";
  const isDueSoon = !done && n >= 0 && n <= 3;
  const isOverdue = !done && n < 0;
  const isShared = activity.ownerId !== currentUser.id;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = done ? "pendiente" : "completada";
    updateActivity(activity.id, { status: next });
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group card-elevated flex cursor-pointer items-start gap-3.5 border-l-4 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
        COMPANY_STYLES[company?.color ?? "personal"].border
      } ${done ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/40" : "bg-white dark:bg-[#101726]"}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
        className={`mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-300 dark:border-slate-600 hover:border-[#1b2640] dark:hover:border-indigo-400"
        }`}
      >
        {done && <Check className="size-3.5 stroke-[3]" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate font-semibold text-slate-900 dark:text-slate-100 leading-snug ${
              done ? "line-through text-slate-400 dark:text-slate-500" : ""
            }`}
          >
            {activity.title}
          </p>
          {!compact && (
            <PriorityBadge priority={activity.priority} className="hidden shrink-0 sm:inline-flex" />
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3.5 text-slate-400 dark:text-slate-500" />
            <span
              className={`font-medium ${
                isOverdue
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : isDueSoon
                  ? "text-amber-700 dark:text-amber-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {relativeLabel(date)}
            </span>
          </span>

          {activity.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-slate-400 dark:text-slate-500" />
              {activity.time}
            </span>
          )}

          {activity.recurrence !== "ninguna" && (
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Repeat className="size-3.5 text-slate-400 dark:text-slate-500" />
              {activity.recurrence === "mensual"
                ? "Mensual"
                : activity.recurrence === "semanal"
                ? "Semanal"
                : "Anual"}
            </span>
          )}

          {isShared && (
            <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-medium">
              <Share2 className="size-3.5 text-indigo-500 dark:text-indigo-400" />
              {owner?.name}
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <CompanyBadge company={company} />
            <PriorityBadge priority={activity.priority} className="sm:hidden" />
            <StatusBadge status={activity.status} />

            {isDueSoon && (
              <span className="inline-flex rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                Vence pronto
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex rounded-full bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                Atrasada
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
