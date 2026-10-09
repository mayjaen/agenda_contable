import { useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  Clock,
  Eye,
  Pencil,
  Repeat,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Activity, Status } from "@/lib/agenda/types";
import {
  RECURRENCE_LABELS,
  REMINDER_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/agenda/types";
import { capitalize, daysUntil, fmtLong, nextOccurrence, relativeLabel } from "@/lib/agenda/dates";
import { Avatar, CompanyBadge, PriorityBadge, StatusBadge, TYPE_ICONS } from "./badges";
import { ActivityForm } from "./ActivityForm";

const STATUSES: Status[] = ["pendiente", "en_progreso", "completada"];

export function TaskDetailModal({
  activityId,
  onClose,
}: {
  activityId: string | null;
  onClose: () => void;
}) {
  const { state, companyById, userById, updateActivity, deleteActivity } = useAgenda();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!activityId) return null;
  const a = state.activities.find((x) => x.id === activityId);

  if (!a) return null;

  const company = companyById(a.companyId);
  const owner = userById(a.ownerId);
  const Icon = TYPE_ICONS[a.type];
  const next = nextOccurrence(a);
  const n = daysUntil(next);
  const done = a.status === "completada";

  const setStatus = (s: Status) => {
    updateActivity(a.id, { status: s });
  };

  const handleDelete = () => {
    deleteActivity(a.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="card-elevated max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Icon className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {TYPE_LABELS[a.type]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {isEditing ? (
          <div className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar actividad</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancelar edición
              </button>
            </div>
            <ActivityForm
              initial={a}
              editingId={a.id}
              onDone={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CompanyBadge company={company} />
                <PriorityBadge priority={a.priority} />
                <StatusBadge status={a.status} />
              </div>
              <h2
                className={`mt-3 text-2xl font-extrabold text-slate-900 dark:text-white leading-tight ${
                  done ? "line-through text-slate-400 dark:text-slate-500" : ""
                }`}
              >
                {a.title}
              </h2>

              {!done && n <= 3 && (
                <div
                  className={`mt-3 rounded-xl px-4 py-2.5 text-xs font-bold ${
                    n < 0
                      ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                      : "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300"
                  }`}
                >
                  {n < 0
                    ? `⚠️ Atrasada: venció ${relativeLabel(next).toLowerCase()}`
                    : n === 0
                    ? "⚠️ Vence hoy"
                    : n === 1
                    ? "⚠️ Vence mañana"
                    : `⚠️ Vence en ${n} días`}
                </div>
              )}
            </div>

            <dl className="grid gap-3.5 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <Calendar className="size-4 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Fecha de ejecución</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{capitalize(fmtLong(next))}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <Clock className="size-4 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Hora</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{a.time || "Sin hora específica"}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <User className="size-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Responsable</dt>
                  <dd className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 truncate">
                    {owner && <Avatar name={owner.name} initials={owner.initials} size="sm" />}
                    <span>{owner?.name || "Sin asignar"}</span>
                  </dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <Eye className="size-4 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Visibilidad</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{VISIBILITY_LABELS[a.visibility]}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <Bell className="size-4 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Recordatorios</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {a.reminders.length
                      ? a.reminders.map((r) => REMINDER_LABELS[r]).join(" · ")
                      : "Sin avisos"}
                  </dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <Repeat className="size-4 text-slate-400 shrink-0" />
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Recurrencia</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{RECURRENCE_LABELS[a.recurrence]}</dd>
                </div>
              </div>
            </dl>

            {a.sharedWith && a.sharedWith.length > 0 && (
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  <Users className="size-3.5" /> Compartido con:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.sharedWith.map((id) => {
                    const u = userById(id);
                    return u ? (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">
                        <Avatar name={u.name} initials={u.initials} size="sm" />
                        {u.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {a.description && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Descripción y pasos
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {a.description}
                </p>
              </div>
            )}

            {/* Selector de estado */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cambiar estado rápidamente
              </p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`cursor-pointer rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      a.status === s
                        ? s === "completada"
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {s === "completada" && a.status === s && <Check className="mr-1 inline size-3.5" />}
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Pencil className="size-3.5" /> Editar
                </button>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-semibold">¿Seguro?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="cursor-pointer rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      Sí, borrar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="cursor-pointer text-xs text-slate-500 hover:underline"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/60 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                  >
                    <Trash2 className="size-3.5" /> Eliminar
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
