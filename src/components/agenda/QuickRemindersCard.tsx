import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  BellRing,
  Check,
  Clock,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { QuickReminder } from "@/lib/agenda/types";
import { todayKey } from "@/lib/agenda/dates";
import { sendSystemNotification } from "@/lib/agenda/notifications";
import { COMPANY_STYLES } from "./badges";

export function QuickRemindersCard({
  onConvertToTask,
}: {
  onConvertToTask?: (reminder: { title: string; companyId?: string | null }) => void;
}) {
  const { state, companyById, addQuickReminder, toggleQuickReminder, deleteQuickReminder, snoozeQuickReminder } =
    useAgenda();

  const [title, setTitle] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("personal");
  const [dueTime, setDueTime] = useState("");
  const [dueDate, setDueDate] = useState(todayKey());
  const [tab, setTab] = useState<"pendientes" | "todos">("pendientes");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const reminders = state.quickReminders || [];
  const activeReminders = reminders.filter((r) => !r.completed);
  const displayedReminders = tab === "pendientes" ? activeReminders : reminders;

  // Preset de horarios rápidos
  const setQuickTime = (type: "15min" | "1hour" | "today4pm" | "tomorrow9am") => {
    const now = new Date();
    if (type === "15min") {
      const future = new Date(now.getTime() + 15 * 60 * 1000);
      setDueTime(`${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`);
      setDueDate(todayKey());
    } else if (type === "1hour") {
      const future = new Date(now.getTime() + 60 * 60 * 1000);
      setDueTime(`${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`);
      setDueDate(todayKey());
    } else if (type === "today4pm") {
      setDueTime("16:00");
      setDueDate(todayKey());
    } else if (type === "tomorrow9am") {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      setDueDate(`${year}-${month}-${day}`);
      setDueTime("09:00");
    }
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const newReminder = addQuickReminder({
      title: title.trim(),
      companyId: selectedCompany === "personal" ? null : selectedCompany,
      dueDate: dueDate || todayKey(),
      dueTime: dueTime || undefined,
      notifyOnBrowser: true,
    });

    setTitle("");
    setDueTime("");
    setDueDate(todayKey());

    setToastMsg("¡Alerta rápida guardada!");
    setTimeout(() => setToastMsg(null), 2500);

    // Opcional: si la hora es ahora o en menos de 5 min, notificar al navegador
    if (newReminder.notifyOnBrowser && typeof Notification !== "undefined" && Notification.permission === "granted") {
      sendSystemNotification(`⚡ Alerta programada: ${newReminder.title}`, {
        body: `Recordatorio configurado para ${newReminder.dueDate}${newReminder.dueTime ? ` a las ${newReminder.dueTime}` : ""}.`,
      });
    }
  };

  const handleTestAlert = (r: QuickReminder) => {
    const comp = companyById(r.companyId ?? null);
    sendSystemNotification(`🔔 Recordatorio Rápido: ${r.title}`, {
      body: `Alerta puntual de ${comp?.name ?? "Personal"}${r.dueTime ? ` a las ${r.dueTime}` : ""}.`,
      tag: `quick-${r.id}`,
    });
    setToastMsg(`Notificación nativa enviada: "${r.title}"`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="card-elevated overflow-hidden bg-white dark:bg-[#101726] shadow-sm border border-slate-200 dark:border-slate-800">
      {/* Cabecera del componente */}
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-[#1b2640] p-4.5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
            <Zap className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight">Recordatorios Rápidos de una sola vez</h3>
              {activeReminders.length > 0 && (
                <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.2 text-[10px] font-black">
                  {activeReminders.length} activo{activeReminders.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Añade alertas puntuales al instante sin tener que llenar un formulario de actividad completo
            </p>
          </div>
        </div>

        {/* Pestañas de filtro rápido */}
        <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 text-[11px] font-bold">
          <button
            onClick={() => setTab("pendientes")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 transition-colors ${
              tab === "pendientes" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-300 hover:text-white"
            }`}
          >
            Pendientes ({activeReminders.length})
          </button>
          <button
            onClick={() => setTab("todos")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 transition-colors ${
              tab === "todos" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-300 hover:text-white"
            }`}
          >
            Todos ({reminders.length})
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Formulario rápido en una sola línea */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe un recordatorio rápido (ej. Llamar a notaría, Enviar contrato, Pedir factura)..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim()}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Añadir alerta</span>
            </button>
          </div>

          {/* Opciones rápidas de horario y empresa */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Presets de tiempo rápido */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mr-0.5">
                Hora:
              </span>
              <button
                type="button"
                onClick={() => setQuickTime("15min")}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
              >
                +15 min
              </button>
              <button
                type="button"
                onClick={() => setQuickTime("1hour")}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
              >
                +1 hora
              </button>
              <button
                type="button"
                onClick={() => setQuickTime("today4pm")}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
              >
                Hoy 4:00 PM
              </button>
              <button
                type="button"
                onClick={() => setQuickTime("tomorrow9am")}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
              >
                Mañana 9 AM
              </button>

              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200"
                title="Hora personalizada"
              />
            </div>

            {/* Empresa rápida */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Área:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCompany("personal")}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  selectedCompany === "personal"
                    ? "bg-slate-800 dark:bg-slate-700 text-white"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                Personal
              </button>
              {state.companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompany(c.id)}
                  className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                    selectedCompany === c.id
                      ? "bg-[#1b2640] dark:bg-indigo-600 text-white"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className={`inline-block size-1.5 rounded-full mr-1 ${COMPANY_STYLES[c.color]?.dot ?? "bg-slate-400"}`} />
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Lista de recordatorios rápidos activos */}
      <div className="p-4">
        {displayedReminders.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            <Clock className="mx-auto mb-1.5 size-6 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No hay alertas rápidas en esta vista.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Escribe una nota arriba para recibir una alerta automática sin crear una tarea formal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedReminders.map((r) => {
              const comp = companyById(r.companyId ?? null);
              const colorInfo = comp ? COMPANY_STYLES[comp.color] : COMPANY_STYLES.personal;

              return (
                <div
                  key={r.id}
                  className={`group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    r.completed
                      ? "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                  }`}
                >
                  {/* Botón de check y título */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleQuickReminder(r.id)}
                      className={`flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
                        r.completed
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-[#1b2640] dark:hover:border-indigo-400"
                      }`}
                      title={r.completed ? "Desmarcar" : "Completar recordatorio"}
                    >
                      {r.completed && <Check className="size-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-bold text-slate-900 dark:text-white ${
                          r.completed ? "line-through text-slate-400 dark:text-slate-500" : ""
                        }`}
                      >
                        {r.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <span className={`size-1.5 rounded-full ${colorInfo.dot}`} />
                          {comp?.name ?? "Personal"}
                        </span>

                        {r.dueTime && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.2 rounded-md">
                            <Clock className="size-2.5" />
                            {r.dueTime}
                          </span>
                        )}

                        <span>{r.dueDate === todayKey() ? "Hoy" : r.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones del recordatorio */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Botón: Probar notificación nativa del navegador */}
                    <button
                      type="button"
                      onClick={() => handleTestAlert(r)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      title="Probar notificación del sistema para esta alerta"
                    >
                      <BellRing className="size-3.5" />
                    </button>

                    {/* Botón: Posponer 30 min */}
                    {!r.completed && (
                      <button
                        type="button"
                        onClick={() => snoozeQuickReminder(r.id, 30)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700"
                        title="Posponer 30 minutos"
                      >
                        <RotateCw className="size-3.5" />
                      </button>
                    )}

                    {/* Botón: Convertir en tarea formal */}
                    {onConvertToTask && (
                      <button
                        type="button"
                        onClick={() => {
                          onConvertToTask({ title: r.title, companyId: r.companyId });
                          deleteQuickReminder(r.id);
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700"
                        title="Convertir en tarea formal con todos los campos"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}

                    {/* Botón: Eliminar */}
                    <button
                      type="button"
                      onClick={() => deleteQuickReminder(r.id)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700"
                      title="Eliminar recordatorio"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
