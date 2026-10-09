import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  Printer,
  TrendingUp,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Activity } from "@/lib/agenda/types";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/agenda/types";
import {
  capitalize,
  daysUntil,
  fmtLong,
  fmtMonth,
  fromKey,
  nextOccurrence,
  occurrencesInRange,
  toKey,
  todayKey,
} from "@/lib/agenda/dates";
import { COMPANY_STYLES } from "@/components/agenda/badges";
import { PageHeader } from "@/components/agenda/ui-bits";

type Mode = "resumen" | "semana" | "dia" | "mes" | "lista";

const MODES: { id: Mode; label: string; icon: typeof BarChart3 }[] = [
  { id: "resumen", label: "Resumen Gerencial", icon: BarChart3 },
  { id: "semana", label: "Agenda semanal", icon: Calendar },
  { id: "dia", label: "Agenda diaria", icon: Clock },
  { id: "mes", label: "Agenda mensual", icon: Calendar },
  { id: "lista", label: "Lista de tareas", icon: FileText },
];

export function PrintView() {
  const { visibleActivities, state, companyById, userById, currentUser } = useAgenda();
  const [mode, setMode] = useState<Mode>("resumen");
  const [dateKey, setDateKey] = useState(todayKey());
  const date = fromKey(dateKey);

  const range = useMemo(() => {
    if (mode === "dia") return { start: date, end: date };
    if (mode === "semana")
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    if (mode === "mes") return { start: startOfMonth(date), end: endOfMonth(date) };
    return { start: date, end: addMonths(date, 3) };
  }, [mode, dateKey, date]);

  const items = visibleActivities.filter((a) => a.type !== "nota");

  const byDay = useMemo(() => {
    const m = new Map<string, Activity[]>();
    for (const a of items) {
      for (const k of occurrencesInRange(a, range.start, range.end)) {
        const arr = m.get(k) ?? [];
        arr.push(a);
        m.set(k, arr);
      }
    }
    for (const arr of m.values()) {
      arr.sort((x, y) => (x.time ?? "99").localeCompare(y.time ?? "99"));
    }
    return m;
  }, [items, range]);

  const listItems = items
    .filter((a) => a.status !== "completada")
    .sort((x, y) => nextOccurrence(x).localeCompare(nextOccurrence(y)));

  // Cálculos para el Resumen Gerencial y Gráficos
  const totalActs = visibleActivities.length;
  const completedActs = visibleActivities.filter((a) => a.status === "completada").length;
  const inProgressActs = visibleActivities.filter((a) => a.status === "en_progreso").length;
  const pendingActs = visibleActivities.filter((a) => a.status === "pendiente").length;
  const overdueActs = visibleActivities.filter(
    (a) => a.status !== "completada" && daysUntil(nextOccurrence(a)) < 0,
  ).length;
  const overallRate = totalActs ? Math.round((completedActs / totalActs) * 100) : 0;

  // Estadísticas por Empresa
  const companyStats = useMemo(() => {
    return state.companies.map((c) => {
      const cItems = visibleActivities.filter((a) => a.companyId === c.id);
      const cDone = cItems.filter((a) => a.status === "completada").length;
      const cPending = cItems.filter((a) => a.status !== "completada").length;
      const cLate = cItems.filter((a) => a.status !== "completada" && daysUntil(nextOccurrence(a)) < 0).length;
      const rate = cItems.length ? Math.round((cDone / cItems.length) * 100) : 0;
      return { company: c, total: cItems.length, done: cDone, pending: cPending, late: cLate, rate };
    });
  }, [state.companies, visibleActivities]);

  // Estadísticas por Prioridad
  const priorityStats = useMemo(() => {
    const urg = visibleActivities.filter((a) => a.priority === "urgente").length;
    const alt = visibleActivities.filter((a) => a.priority === "alta").length;
    const med = visibleActivities.filter((a) => a.priority === "media").length;
    const baj = visibleActivities.filter((a) => a.priority === "baja").length;
    return [
      { label: "Urgente", count: urg, color: "bg-rose-500", text: "text-rose-600" },
      { label: "Alta", count: alt, color: "bg-amber-500", text: "text-amber-600" },
      { label: "Media", count: med, color: "bg-sky-500", text: "text-sky-600" },
      { label: "Baja", count: baj, color: "bg-slate-400", text: "text-slate-500" },
    ];
  }, [visibleActivities]);

  // Estadísticas por Integrante (Carga de Trabajo)
  const userStats = useMemo(() => {
    return state.users.map((u) => {
      const uItems = visibleActivities.filter((a) => a.ownerId === u.id);
      const uDone = uItems.filter((a) => a.status === "completada").length;
      const uPending = uItems.length - uDone;
      const uRate = uItems.length ? Math.round((uDone / uItems.length) * 100) : 0;
      return { user: u, total: uItems.length, done: uDone, pending: uPending, rate: uRate };
    });
  }, [state.users, visibleActivities]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Título",
      "Tipo",
      "Empresa",
      "Responsable",
      "Fecha",
      "Hora",
      "Prioridad",
      "Estado",
      "Visibilidad",
      "Recurrencia",
      "Descripción",
    ];

    const rows = visibleActivities.map((a) => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      TYPE_LABELS[a.type] || a.type,
      `"${companyById(a.companyId)?.name ?? "Personal"}"`,
      `"${userById(a.ownerId)?.name ?? ""}"`,
      a.date,
      a.time ?? "",
      PRIORITY_LABELS[a.priority] ?? a.priority,
      STATUS_LABELS[a.status] ?? a.status,
      a.visibility,
      a.recurrence,
      `"${(a.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_agenda_${toKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(visibleActivities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agenda_completa_${toKey(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const heading =
    mode === "resumen"
      ? `Resumen Gerencial de Gestión — ${state.orgName || "Grupo Nuvia"}`
      : mode === "dia"
      ? capitalize(fmtLong(date))
      : mode === "semana"
      ? `Semana del ${format(range.start, "d 'de' MMMM", { locale: es })} al ${format(range.end, "d 'de' MMMM yyyy", { locale: es })}`
      : mode === "mes"
      ? capitalize(fmtMonth(date))
      : "Lista de tareas pendientes";

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Imprimir / Exportar Reportes"
          subtitle="Genera informes gerenciales con métricas y gráficos, o exporta los datos para auditoría, comités o dirección."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                title="Descargar archivo compatible con Microsoft Excel"
              >
                <FileSpreadsheet className="size-4" /> Exportar Excel / CSV
              </button>

              <button
                onClick={handleExportJSON}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="size-4" /> JSON
              </button>

              <button
                onClick={() => window.print()}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                <Printer className="size-4" /> Imprimir / PDF
              </button>
            </div>
          }
        />

        {/* Barra de modos */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-2xl bg-white dark:bg-[#101726] p-1.5 shadow-xs border border-slate-200 dark:border-slate-800">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    mode === m.id
                      ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {mode !== "resumen" && (
            <input
              type="date"
              value={dateKey}
              onChange={(e) => e.target.value && setDateKey(e.target.value)}
              className="h-10 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-hidden"
            />
          )}
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL / VISTA GERENCIAL */}
      <div className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-8">
        {/* Cabecera oficial para reporte */}
        <div className="mb-6 flex flex-col gap-2 border-b-2 border-[#1b2640] dark:border-indigo-500 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-[#1b2640] dark:bg-indigo-600 text-[11px] font-black text-white">
                N
              </span>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Nuestra Agenda — Coordinación Corporativa
              </p>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{heading}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Espacio: <strong>{state.orgName || "Grupo Nuvia"}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400">
            <p>Generado por: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong></p>
            <p>Fecha de emisión: {format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>

        {/* MODO 1: RESUMEN GERENCIAL CON GRÁFICOS */}
        {mode === "resumen" && (
          <div className="space-y-8">
            {/* 1. Indicadores Clave de Desempeño (KPIs) */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Métricas Clave de Desempeño y Cumplimiento
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Actividades</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalActs}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">En el periodo actual</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-4">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">Tasa de Cumplimiento</span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{overallRate}%</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">{completedActs} completadas</p>
                </div>

                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/40 p-4">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase">En Progreso / Pendientes</span>
                  <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">{pendingActs + inProgressActs}</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{inProgressActs} en gestión activa</p>
                </div>

                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/40 p-4">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase">Atrasadas / Riesgo</span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{overdueActs}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Requieren atención inmediata</p>
                </div>
              </div>
            </div>

            {/* 2. Gráfico: Avance y Cumplimiento por Empresa */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#1b2640] dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Avance de Cumplimiento por Empresa / Área de Negocio
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completadas vs Total</span>
              </div>

              <div className="space-y-4">
                {companyStats.map(({ company: c, total, done, rate, late }) => {
                  const s = COMPANY_STYLES[c.color];
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                          <span className={`size-2.5 rounded-full ${s.dot}`} />
                          <span>{c.name}</span>
                          <span className="text-[11px] font-normal text-slate-400">({c.area})</span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold">
                          {late > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">⚠️ {late} atrasada{late > 1 ? "s" : ""}</span>
                          )}
                          <span className="text-slate-600 dark:text-slate-400">
                            {done} / {total} actividades ({rate}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${s.bg}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Dos columnas de gráficos: Prioridad & Carga por integrante */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gráfico de Prioridades */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 shadow-xs">
                <div className="mb-3 flex items-center gap-2">
                  <PieChart className="size-4 text-[#1b2640] dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Distribución por Nivel de Prioridad</h3>
                </div>

                <div className="space-y-3 pt-2">
                  {priorityStats.map((p) => {
                    const pct = totalActs ? Math.round((p.count / totalActs) * 100) : 0;
                    return (
                      <div key={p.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{p.label}</span>
                          <span className={`font-bold ${p.text}`}>
                            {p.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico de Desempeño por Integrante */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 shadow-xs">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#1b2640] dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Carga de Trabajo y Efectividad por Integrante</h3>
                </div>

                <div className="space-y-3 pt-2">
                  {userStats.map(({ user: u, total, done, rate }) => (
                    <div key={u.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.name} {u.title ? `(${u.title.split("/")[0]})` : ""}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {done}/{total} ({rate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#1b2640] dark:bg-indigo-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Tabla de Vencimientos Legales y Críticos */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. Vencimientos Legales y Fiscales Clave (SIPE, ITBMS, Cierres)
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <th className="p-3 text-left">Actividad / Obligación</th>
                      <th className="p-3 text-left">Empresa</th>
                      <th className="p-3 text-left">Responsable</th>
                      <th className="p-3 text-left">Fecha Límite</th>
                      <th className="p-3 text-left">Prioridad</th>
                      <th className="p-3 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleActivities
                      .filter((a) => a.type === "vencimiento" || a.priority === "urgente")
                      .map((a) => {
                        const next = nextOccurrence(a);
                        const n = daysUntil(next);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{a.title}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{companyById(a.companyId)?.name ?? "Personal"}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{userById(a.ownerId)?.name}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {next} ({n === 0 ? "Hoy" : n < 0 ? `Venció hace ${Math.abs(n)} días` : `En ${n} días`})
                            </td>
                            <td className="p-3">{PRIORITY_LABELS[a.priority]}</td>
                            <td className="p-3 font-semibold">
                              {a.status === "completada" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="size-3" /> Completada
                                </span>
                              ) : n < 0 ? (
                                <span className="text-rose-700 dark:text-rose-400 font-bold">Atrasada</span>
                              ) : (
                                <span className="text-amber-800 dark:text-amber-400 font-bold">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: LISTA DE TAREAS */}
        {mode === "lista" && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="w-6 py-2.5" />
                <th className="py-2.5">Tarea</th>
                <th className="py-2.5">Empresa</th>
                <th className="py-2.5">Responsable</th>
                <th className="py-2.5">Fecha</th>
                <th className="py-2.5">Prioridad</th>
                <th className="py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {listItems.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5">
                    <span className="inline-block size-3.5 rounded-sm border border-slate-400 dark:border-slate-600" />
                  </td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">{a.title}</td>
                  <td className="py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {companyById(a.companyId)?.name ?? "Personal"}
                  </td>
                  <td className="py-2.5 text-xs text-slate-600 dark:text-slate-300">{userById(a.ownerId)?.name}</td>
                  <td className="py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    {format(fromKey(nextOccurrence(a)), "d MMM", { locale: es })}
                  </td>
                  <td className="py-2.5 text-xs">{PRIORITY_LABELS[a.priority]}</td>
                  <td className="py-2.5 text-xs">{STATUS_LABELS[a.status]}</td>
                </tr>
              ))}
              {!listItems.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No hay tareas pendientes en este rango.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* MODOS SEMANA / DÍA / MES */}
        {(mode === "semana" || mode === "dia" || mode === "mes") && (
          <div className={`space-y-6 ${mode === "mes" ? "columns-1 md:columns-2 gap-8" : ""}`}>
            {eachDayOfInterval(range).map((d) => {
              const k = toKey(d);
              const arr = byDay.get(k) ?? [];
              if (mode === "mes" && !arr.length) return null;

              return (
                <div key={k} className="break-inside-avoid">
                  <h3 className="mb-2 border-b border-slate-200 dark:border-slate-800 pb-1 text-sm font-extrabold text-slate-900 dark:text-white">
                    {capitalize(format(d, "EEEE d 'de' MMMM", { locale: es }))}
                  </h3>

                  {arr.length ? (
                    <ul className="space-y-1.5">
                      {arr.map((a) => {
                        const c = companyById(a.companyId);
                        return (
                          <li key={a.id + k} className="flex items-start gap-2.5 text-xs">
                            <span className="mt-0.5 inline-block size-3.5 shrink-0 rounded-sm border border-slate-400 dark:border-slate-600" />
                            <span className="w-12 shrink-0 font-mono font-bold text-slate-500 dark:text-slate-400">
                              {a.time ?? "—"}
                            </span>
                            <span
                              className={`mt-1 size-2 shrink-0 rounded-full ${
                                COMPANY_STYLES[c?.color ?? "personal"].dot
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <span
                                className={`font-semibold text-slate-800 dark:text-slate-200 ${
                                  a.status === "completada" ? "line-through text-slate-400 dark:text-slate-500" : ""
                                }`}
                              >
                                {a.title}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500">
                                {" "}
                                · {TYPE_LABELS[a.type]} · {c?.name ?? "Personal"} · {userById(a.ownerId)?.name}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-slate-400 dark:text-slate-500">Sin actividades agendadas</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
