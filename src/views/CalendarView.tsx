import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Activity } from "@/lib/agenda/types";
import { capitalize, fmtLong, fmtMonth, occurrencesInRange, shiftDay, toKey } from "@/lib/agenda/dates";
import { ActivityCard } from "@/components/agenda/ActivityCard";
import { COMPANY_STYLES, TYPE_ICONS } from "@/components/agenda/badges";
import { Chip, EmptyState, PageHeader } from "@/components/agenda/ui-bits";

type View = "dia" | "semana" | "mes";

export function CalendarView({
  onSelectActivity,
  onCreateForDate,
}: {
  onSelectActivity: (id: string) => void;
  onCreateForDate?: (dateKey: string) => void;
}) {
  const { visibleActivities, companyById, state } = useAgenda();
  const [view, setView] = useState<View>("semana");
  const [cursor, setCursor] = useState(() => new Date());

  const range = useMemo(() => {
    if (view === "dia") return { start: cursor, end: cursor };
    if (view === "semana")
      return { start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) };
    return {
      start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    };
  }, [view, cursor]);

  const occ = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of visibleActivities) {
      if (a.type === "nota") continue;
      for (const k of occurrencesInRange(a, range.start, range.end)) {
        const arr = map.get(k) ?? [];
        arr.push(a);
        map.set(k, arr);
      }
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => (x.time ?? "99").localeCompare(y.time ?? "99"));
    }
    return map;
  }, [visibleActivities, range.start, range.end]);

  const days = eachDayOfInterval(range);
  const today = new Date();

  const move = (dir: 1 | -1) =>
    setCursor((c) =>
      view === "dia" ? shiftDay(c, dir) : view === "semana" ? addWeeks(c, dir) : addMonths(c, dir),
    );

  const title =
    view === "dia"
      ? capitalize(fmtLong(cursor))
      : view === "semana"
      ? `${format(range.start, "d MMM", { locale: es })} – ${format(range.end, "d MMM yyyy", { locale: es })}`
      : capitalize(fmtMonth(cursor));

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Visualiza reuniones, tareas y vencimientos programados por día, semana o mes."
        actions={
          <div className="flex gap-1 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-xs border border-slate-200 dark:border-slate-700">
            {(["dia", "semana", "mes"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`h-8 cursor-pointer rounded-lg px-3.5 text-xs font-semibold capitalize transition-colors ${
                  view === v
                    ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        }
      />

      {/* Barra de navegación de fecha */}
      <div className="mb-5 flex items-center justify-between gap-2 rounded-2xl bg-white dark:bg-[#101726] p-3 shadow-xs border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => move(-1)}
          aria-label="Anterior"
          className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="min-w-0 text-center">
          <p className="truncate text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">{title}</p>
          <button
            onClick={() => setCursor(new Date())}
            className="cursor-pointer text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            Volver a hoy
          </button>
        </div>

        <button
          onClick={() => move(1)}
          aria-label="Siguiente"
          className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* VISTA: MES */}
      {view === "mes" && (
        <div className="card-elevated overflow-hidden bg-white dark:bg-[#101726]">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {days.map((d) => {
              const k = toKey(d);
              const items = occ.get(k) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);

              return (
                <div
                  key={d.toISOString()}
                  onClick={() => {
                    setCursor(d);
                    setView("dia");
                  }}
                  className={`flex min-h-[80px] cursor-pointer flex-col items-start gap-1 p-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:min-h-[110px] sm:p-2.5 ${
                    !inMonth ? "bg-slate-50/50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-600" : "bg-white dark:bg-[#101726]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs font-extrabold ${
                        isToday
                          ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs"
                          : inMonth
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {format(d, "d")}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 sm:hidden">
                        {items.length}
                      </span>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-1 overflow-hidden">
                    {items.slice(0, 3).map((a) => {
                      const c = companyById(a.companyId);
                      return (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectActivity(a.id);
                          }}
                          className={`hidden truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:block ${
                            COMPANY_STYLES[c?.color ?? "personal"].soft
                          } ${a.status === "completada" ? "line-through opacity-50" : ""}`}
                        >
                          {a.time ? `${a.time} ` : ""}{a.title}
                        </div>
                      );
                    })}

                    {/* Versión móvil: puntos de color */}
                    <div className="flex flex-wrap gap-1 sm:hidden mt-1">
                      {items.slice(0, 4).map((a) => {
                        const c = companyById(a.companyId);
                        return (
                          <span
                            key={a.id}
                            className={`size-1.5 rounded-full ${COMPANY_STYLES[c?.color ?? "personal"].dot}`}
                          />
                        );
                      })}
                    </div>

                    {items.length > 3 && (
                      <span className="hidden text-[10px] font-semibold text-slate-400 sm:block">
                        +{items.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA: SEMANA */}
      {view === "semana" && (
        <div className="space-y-3">
          {days.map((d) => {
            const k = toKey(d);
            const items = occ.get(k) ?? [];
            const isToday = isSameDay(d, today);

            return (
              <div key={k} className="grid grid-cols-[60px_minmax(0,1fr)] gap-3 sm:grid-cols-[75px_minmax(0,1fr)]">
                <button
                  onClick={() => {
                    setCursor(d);
                    setView("dia");
                  }}
                  className={`flex h-16 cursor-pointer flex-col items-center justify-center rounded-2xl border text-center transition-all ${
                    isToday
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101726] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {format(d, "EEE", { locale: es }).replace(".", "")}
                  </span>
                  <span className="text-xl font-black leading-none">{format(d, "d")}</span>
                </button>

                <div className="min-w-0 space-y-2">
                  {items.length ? (
                    items.map((a) => (
                      <DayRowItem
                        key={a.id + k}
                        activity={a}
                        onClick={() => onSelectActivity(a.id)}
                      />
                    ))
                  ) : (
                    <button
                      onClick={() => onCreateForDate?.(k)}
                      className="flex h-16 w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-4 text-xs font-medium text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900/80"
                    >
                      <span>Sin actividades agendadas</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">+ Agregar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA: DÍA */}
      {view === "dia" && (
        <div className="space-y-3">
          {(occ.get(toKey(cursor)) ?? []).length ? (
            (occ.get(toKey(cursor)) ?? []).map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                dateOverride={toKey(cursor)}
                onClick={() => onSelectActivity(a.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Día libre"
              description={`No hay actividades programadas para el ${format(cursor, "d 'de' MMMM", { locale: es })}.`}
              action={
                <button
                  onClick={() => onCreateForDate?.(toKey(cursor))}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
                >
                  <Plus className="size-4 stroke-[3]" /> Agregar actividad en este día
                </button>
              }
            />
          )}
        </div>
      )}

      {/* Leyenda de colores de empresa */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
        <Chip className="pointer-events-none">Empresas:</Chip>
        {state.companies.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className={`size-2.5 rounded-full ${COMPANY_STYLES[c.color].dot}`} /> {c.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="size-2.5 rounded-full bg-slate-400" /> Personal
        </span>
      </div>
    </div>
  );
}

function DayRowItem({
  activity,
  onClick,
}: {
  activity: Activity;
  onClick: () => void;
}) {
  const { companyById } = useAgenda();
  const c = companyById(activity.companyId);
  const Icon = TYPE_ICONS[activity.type];
  const done = activity.status === "completada";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`card-elevated flex cursor-pointer items-center gap-3 border-l-4 bg-white dark:bg-[#101726] px-4 py-3 shadow-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-sm ${
        COMPANY_STYLES[c?.color ?? "personal"].border
      } ${done ? "opacity-50" : ""}`}
    >
      <span className="w-14 shrink-0 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
        {activity.time ?? "—"}
      </span>
      <Icon className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white ${
          done ? "line-through text-slate-400 dark:text-slate-500" : ""
        }`}
      >
        {activity.title}
      </span>
      <span className="hidden truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:block">
        {c?.name ?? "Personal"}
      </span>
    </div>
  );
}
