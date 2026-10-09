import { useMemo, useState } from "react";
import { Building2, Check, Lock, Users } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Activity, ActivityType, Priority, Recurrence, Reminder, Visibility } from "@/lib/agenda/types";
import {
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  REMINDER_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/agenda/types";
import { todayKey } from "@/lib/agenda/dates";
import { COMPANY_STYLES, TYPE_ICONS } from "./badges";

const TYPES: ActivityType[] = ["tarea", "reunion", "cita", "recordatorio", "vencimiento", "nota"];
const PRIORITIES: Priority[] = ["baja", "media", "alta", "urgente"];
const VISIBILITIES: Visibility[] = ["privada", "compartida", "empresa"];
const REMINDERS: Reminder[] = ["3_dias", "1_dia", "mismo_dia"];
const RECURRENCES: Recurrence[] = ["ninguna", "semanal", "mensual", "anual"];

export type ActivityDraft = { [K in keyof Activity]?: Activity[K] | undefined };

type FormValues = {
  type: ActivityType;
  title: string;
  companyId: string; // "personal" = sin empresa
  ownerId: string;
  sharedWith: string[];
  date: string;
  time: string;
  priority: Priority;
  visibility: Visibility;
  reminders: Reminder[];
  recurrence: Recurrence;
  description: string;
};

export function ActivityForm({
  initial,
  editingId,
  onDone,
  fromNoteId,
}: {
  initial?: ActivityDraft;
  editingId?: string;
  onDone?: (id?: string) => void;
  fromNoteId?: string;
}) {
  const { state, currentUser, addActivity, updateActivity, addNote, updateNote } = useAgenda();

  // Si no hay empresa inicial o está en personal y la visibilidad es empresa, asignar la primera empresa disponible
  const defaultCompany =
    initial?.companyId ??
    (state.companies.length > 0 ? state.companies[0]?.id : "personal") ??
    "personal";

  const [v, setV] = useState<FormValues>({
    type: initial?.type ?? "tarea",
    title: initial?.title ?? "",
    companyId: initial?.companyId ?? defaultCompany,
    ownerId: initial?.ownerId ?? currentUser.id,
    sharedWith: initial?.sharedWith ?? [],
    date: initial?.date ?? todayKey(),
    time: initial?.time ?? "",
    priority: initial?.priority ?? "media",
    // REQUISITO 2: La visibilidad para Empresa/Equipo siempre está habilitada y lista
    visibility: initial?.visibility ?? "empresa",
    reminders: initial?.reminders ?? ["1_dia"],
    recurrence: initial?.recurrence ?? "ninguna",
    description: initial?.description ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const company = state.companies.find((c) => c.id === v.companyId);
  const candidates = useMemo(
    () => (company ? state.users.filter((u) => company.memberIds.includes(u.id)) : state.users),
    [company, state.users],
  );
  const isNote = v.type === "nota";

  const handleSelectVisibility = (vis: Visibility) => {
    // Si elige "empresa" y estaba en "personal", asignar automáticamente la primera empresa
    if (vis === "empresa" && v.companyId === "personal" && state.companies.length > 0) {
      setV((s) => ({
        ...s,
        visibility: vis,
        companyId: state.companies[0]?.id || "personal",
      }));
    } else {
      set("visibility", vis);
    }
  };

  const handleSelectCompany = (compVal: string) => {
    if (compVal === "personal") {
      setV((s) => ({
        ...s,
        companyId: "personal",
        visibility: s.visibility === "empresa" ? "privada" : s.visibility,
      }));
    } else {
      const selectedComp = state.companies.find((c) => c.id === compVal);
      setV((s) => ({
        ...s,
        companyId: compVal,
        visibility: "empresa", // Habilita visibilidad Empresa por defecto
        ownerId: selectedComp && !selectedComp.memberIds.includes(s.ownerId) ? currentUser.id : s.ownerId,
      }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.title.trim()) {
      setError("Por favor escribe un título para continuar.");
      return;
    }
    setError(null);
    const companyId = v.companyId === "personal" ? null : v.companyId;

    if (isNote) {
      const createdNote = addNote({
        title: v.title.trim(),
        content: v.description.trim(),
        companyId,
        authorId: currentUser.id,
      });
      setSuccessMsg("Nota guardada correctamente.");
      setTimeout(() => {
        onDone?.(createdNote.id);
      }, 500);
      return;
    }

    const payload = {
      type: v.type,
      title: v.title.trim(),
      companyId,
      ownerId: v.ownerId,
      sharedWith: v.visibility === "compartida" ? v.sharedWith.filter((id) => id !== v.ownerId) : [],
      date: v.date,
      ...(v.time ? { time: v.time } : {}),
      description: v.description.trim(),
      priority: v.priority,
      status: initial?.status ?? ("pendiente" as const),
      visibility: v.visibility,
      reminders: v.reminders,
      recurrence: v.recurrence,
    };

    if (editingId) {
      updateActivity(editingId, payload);
      setSuccessMsg("Cambios guardados con éxito.");
      setTimeout(() => {
        onDone?.(editingId);
      }, 500);
    } else {
      const created = addActivity(payload);
      if (fromNoteId) {
        updateNote(fromNoteId, { convertedActivityId: created.id });
      }
      setSuccessMsg(`${TYPE_LABELS[v.type]} creada exitosamente.`);
      setTimeout(() => {
        onDone?.(created.id);
      }, 500);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {successMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          ✓ {successMsg}
        </div>
      )}

      {/* Selector de Tipo */}
      {!editingId && (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            ¿Qué deseas crear?
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TYPES.map((t) => {
              const Icon = TYPE_ICONS[t];
              const active = v.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                    active
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#1b2640]/50 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="size-5" />
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-elevated space-y-5 p-4 sm:p-6 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800">
        {/* Título */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Título <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={isNote ? "Ej. Documentos pendientes del cliente Rodríguez" : "Ej. Presentar SIPE mensual"}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden"
            autoFocus
          />
          {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        </div>

        {/* Empresa o Área */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Empresa o área responsable</label>
            <span className="text-xs text-slate-400">Determina el color y los integrantes con acceso</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.companies.map((c) => (
              <ChoicePill
                key={c.id}
                active={v.companyId === c.id}
                colorDot={COMPANY_STYLES[c.color].dot}
                onClick={() => handleSelectCompany(c.id)}
              >
                {c.name}
              </ChoicePill>
            ))}
            <ChoicePill
              active={v.companyId === "personal"}
              onClick={() => handleSelectCompany("personal")}
              colorDot="bg-slate-400"
            >
              Personal (Sin empresa)
            </ChoicePill>
          </div>
        </div>

        {!isNote && (
          <>
            {/* Responsable & Prioridad */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Responsable asignado</label>
                <select
                  value={v.ownerId}
                  onChange={(e) => set("ownerId", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === currentUser.id ? "(yo)" : ""} {u.title ? `— ${u.title}` : ""}
                    </option>
                  ))}
                  {candidates.length === 0 && (
                    <option value={currentUser.id}>{currentUser.name} (yo)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Nivel de prioridad</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("priority", p)}
                      className={`h-10 cursor-pointer rounded-lg border text-xs font-semibold transition-colors ${
                        v.priority === p
                          ? p === "urgente"
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fecha & Hora */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Fecha límite / Ejecución <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={v.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Hora (opcional)</label>
                <input
                  type="time"
                  value={v.time}
                  onChange={(e) => set("time", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* REQUISITO 2: VISIBILIDAD HABILITADA PARA EMPRESA/EQUIPO */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  Visibilidad de la actividad
                </label>
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                  {v.visibility === "empresa" && company ? `Visible para todo el equipo de ${company.name}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Botón 1: Empresa / Equipo */}
                <button
                  key="empresa"
                  type="button"
                  onClick={() => handleSelectVisibility("empresa")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    v.visibility === "empresa"
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Building2 className="size-4 shrink-0" />
                  <span>Empresa / Equipo</span>
                </button>

                {/* Botón 2: Compartida */}
                <button
                  key="compartida"
                  type="button"
                  onClick={() => handleSelectVisibility("compartida")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    v.visibility === "compartida"
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Users className="size-4 shrink-0" />
                  <span>Compartida</span>
                </button>

                {/* Botón 3: Privada */}
                <button
                  key="privada"
                  type="button"
                  onClick={() => handleSelectVisibility("privada")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    v.visibility === "privada"
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Lock className="size-4 shrink-0" />
                  <span>Privada</span>
                </button>
              </div>

              {/* Mensaje explicativo */}
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {v.visibility === "empresa" && (
                  <p className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-medium">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    {company
                      ? `Visible para los ${company.memberIds.length} integrantes de ${company.name}.`
                      : "Visible para todo el equipo de la empresa seleccionada."}
                  </p>
                )}
                {v.visibility === "compartida" && (
                  <p className="text-slate-500 dark:text-slate-400">
                    Visible únicamente para el responsable y los integrantes que selecciones a continuación.
                  </p>
                )}
                {v.visibility === "privada" && (
                  <p className="text-slate-500 dark:text-slate-400">
                    Solo tú podrás ver esta actividad en tu agenda personal.
                  </p>
                )}
              </div>

              {/* Si es compartida, selector de personas */}
              {v.visibility === "compartida" && (
                <div className="mt-3 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Seleccionar personas con quién compartir:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {state.users
                      .filter((u) => u.id !== v.ownerId)
                      .map((u) => {
                        const on = v.sharedWith.includes(u.id);
                        return (
                          <ChoicePill
                            key={u.id}
                            active={on}
                            onClick={() =>
                              set(
                                "sharedWith",
                                on ? v.sharedWith.filter((x) => x !== u.id) : [...v.sharedWith, u.id],
                              )
                            }
                          >
                            {u.name}
                          </ChoicePill>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Recordatorios & Repetición */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Recordatorios automáticos</label>
                <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                  {REMINDERS.map((r) => {
                    const on = v.reminders.includes(r);
                    return (
                      <label key={r} className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) =>
                            set(
                              "reminders",
                              e.target.checked
                                ? [...v.reminders, r]
                                : v.reminders.filter((x) => x !== r),
                            )
                          }
                          className="size-4 rounded text-[#1b2640]"
                        />
                        {REMINDER_LABELS[r]}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Recurrencia / Repetición</label>
                <select
                  value={v.recurrence}
                  onChange={(e) => set("recurrence", e.target.value as Recurrence)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {RECURRENCES.map((r) => (
                    <option key={r} value={r}>
                      {RECURRENCE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {v.recurrence === "mensual" && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Obligaciones recurrentes (SIPE, ITBMS, conciliaciones): se repetirá automáticamente el mismo día cada mes.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Descripción */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {isNote ? "Contenido de la nota" : "Descripción y notas adicionales"}
          </label>
          <textarea
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder={isNote ? "Escribe tus apuntes o recordatorios aquí…" : "Detalles, pasos necesarios, enlaces o documentos a revisar…"}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onDone && (
          <button
            type="button"
            onClick={() => onDone()}
            className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#283759] dark:hover:bg-indigo-500"
        >
          {editingId
            ? "Guardar cambios"
            : isNote
            ? "Guardar nota"
            : `Crear ${TYPE_LABELS[v.type].toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

function ChoicePill({
  active,
  onClick,
  children,
  colorDot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorDot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
        active
          ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-xs"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      }`}
    >
      {colorDot && <span className={`size-2 rounded-full ${colorDot} ${active ? "ring-2 ring-white/60" : ""}`} />}
      {children}
    </button>
  );
}
