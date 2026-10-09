import {
  AlarmClock,
  ArrowRight,
  Bell,
  CheckSquare,
  Flame,
  Plus,
  Users,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { capitalize, daysUntil, fmtLong, nextOccurrence, reminderFiresToday, todayKey } from "@/lib/agenda/dates";
import { ActivityCard } from "@/components/agenda/ActivityCard";
import { COMPANY_STYLES } from "@/components/agenda/badges";
import { EmptyState, SectionTitle } from "@/components/agenda/ui-bits";
import { QuickRemindersCard } from "@/components/agenda/QuickRemindersCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardView({
  onSelectActivity,
  onNavigate,
  onConvertToTask,
  onFilterCompany,
}: {
  onSelectActivity: (id: string) => void;
  onNavigate: (tab: "tareas" | "calendario" | "empresas" | "crear") => void;
  onConvertToTask?: (reminder: { title: string; companyId?: string | null }) => void;
  onFilterCompany?: (companyId: string) => void;
}) {
  const { currentUser, visibleActivities, state } = useAgenda();
  const today = todayKey();
  const open = visibleActivities.filter((a) => a.status !== "completada");

  const urgent = open
    .filter((a) => a.priority === "urgente" || a.priority === "alta" || daysUntil(nextOccurrence(a)) < 0)
    .sort((x, y) => nextOccurrence(x).localeCompare(nextOccurrence(y)))
    .slice(0, 5);

  const todayItems = open
    .filter((a) => nextOccurrence(a) === today && a.type !== "reunion" && a.type !== "cita")
    .sort((x, y) => (x.time ?? "99").localeCompare(y.time ?? "99"));

  const meetings = open
    .filter((a) => (a.type === "reunion" || a.type === "cita") && nextOccurrence(a) === today)
    .sort((x, y) => (x.time ?? "99").localeCompare(y.time ?? "99"));

  const deadlines = open
    .filter((a) => {
      const n = daysUntil(nextOccurrence(a));
      return (a.type === "vencimiento" || a.reminders.length > 0) && n >= 0 && n <= 14;
    })
    .sort((x, y) => nextOccurrence(x).localeCompare(nextOccurrence(y)))
    .slice(0, 5);

  const reminders = open.filter((a) => reminderFiresToday(a));

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{capitalize(fmtLong(new Date()))}</p>
          <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {greeting()}, {currentUser.name}
          </h1>
        </div>
        <button
          onClick={() => onNavigate("crear")}
          className="hidden cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#283759] md:inline-flex"
        >
          <Plus className="size-4 stroke-[3]" />
          Nueva actividad
        </button>
      </header>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={CheckSquare} label="Pendientes" value={open.length} tone="default" />
        <StatCard icon={Flame} label="Para hoy" value={todayItems.length + meetings.length} tone="warning" />
        <StatCard icon={Bell} label="Recordatorios hoy" value={reminders.length} tone="info" />
        <StatCard
          icon={AlarmClock}
          label="Atrasadas"
          value={open.filter((a) => daysUntil(nextOccurrence(a)) < 0).length}
          tone="danger"
        />
      </div>

      {/* Banner de Recordatorios de hoy */}
      {reminders.length > 0 && (
        <section className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
            <Bell className="size-4" /> Avisos y recordatorios programados para hoy
          </div>
          <ul className="space-y-2">
            {reminders.map((a) => {
              const n = daysUntil(nextOccurrence(a));
              return (
                <li key={a.id}>
                  <button
                    onClick={() => onSelectActivity(a.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-sm text-slate-800 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 hover:underline"
                  >
                    <span className="truncate font-semibold">{a.title}</span>
                    <span className="shrink-0 rounded-full bg-amber-200/70 dark:bg-amber-900/60 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      {n === 0 ? "Vence hoy" : n === 1 ? "Vence mañana" : `Vence en ${n} días`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Componente: Recordatorios Rápidos de una sola vez */}
      <section>
        <QuickRemindersCard onConvertToTask={onConvertToTask} />
      </section>

      {/* Grilla principal */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Urgentes e importantes */}
        <section className="min-w-0">
          <SectionTitle action={<SeeAllAction onClick={() => onNavigate("tareas")} label="Ver tareas" />}>
            Urgentes e importantes
          </SectionTitle>
          {urgent.length ? (
            <div className="space-y-2.5">
              {urgent.map((a) => (
                <ActivityCard key={a.id} activity={a} onClick={() => onSelectActivity(a.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Flame} title="Nada urgente" description="Todo bajo control por el momento." />
          )}
        </section>

        {/* Tareas de hoy */}
        <section className="min-w-0">
          <SectionTitle action={<SeeAllAction onClick={() => onNavigate("calendario")} label="Ver calendario" />}>
            Tareas de hoy
          </SectionTitle>
          {todayItems.length ? (
            <div className="space-y-2.5">
              {todayItems.map((a) => (
                <ActivityCard key={a.id} activity={a} compact onClick={() => onSelectActivity(a.id)} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="Sin tareas para hoy"
              description="No hay tareas pendientes asignadas para el día de hoy."
              action={
                <button
                  onClick={() => onNavigate("crear")}
                  className="cursor-pointer text-sm font-semibold text-indigo-700 underline hover:text-indigo-900"
                >
                  + Crear actividad
                </button>
              }
            />
          )}
        </section>

        {/* Reuniones y citas de hoy */}
        <section className="min-w-0">
          <SectionTitle>Reuniones y citas de hoy</SectionTitle>
          {meetings.length ? (
            <div className="space-y-2.5">
              {meetings.map((a) => (
                <ActivityCard key={a.id} activity={a} compact onClick={() => onSelectActivity(a.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Sin reuniones hoy" description="No hay reuniones agendadas para hoy." />
          )}
        </section>

        {/* Próximos vencimientos (e.g. SIPE, ITBMS) */}
        <section className="min-w-0">
          <SectionTitle>Próximos vencimientos</SectionTitle>
          {deadlines.length ? (
            <div className="card-elevated divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#101726]">
              {deadlines.map((a) => {
                const d = nextOccurrence(a);
                const n = daysUntil(d);
                const c = state.companies.find((x) => x.id === a.companyId);
                return (
                  <div
                    key={a.id}
                    onClick={() => onSelectActivity(a.id)}
                    className="flex cursor-pointer items-center gap-3.5 p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div
                      className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl text-white font-extrabold ${
                        n <= 3 ? "bg-rose-600" : COMPANY_STYLES[c?.color ?? "personal"].bg
                      }`}
                    >
                      <span className="text-base leading-none">{d.slice(8)}</span>
                      <span className="text-[9px] uppercase tracking-wider leading-none mt-0.5">
                        {new Date(d + "T12:00").toLocaleDateString("es", { month: "short" }).replace(".", "")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c?.name ?? "Personal"}</p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        n <= 3 ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {n === 0 ? "Hoy" : n === 1 ? "Mañana" : `${n} días`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={AlarmClock} title="Sin vencimientos próximos" description="No hay vencimientos en los próximos 14 días." />
          )}
        </section>
      </div>

      {/* Resumen por Empresa */}
      <section>
        <SectionTitle action={<SeeAllAction onClick={() => onNavigate("empresas")} label="Ver áreas" />}>
          Resumen por empresa y área
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {state.companies.map((c) => {
            const items = visibleActivities.filter((a) => a.companyId === c.id);
            const pending = items.filter((a) => a.status !== "completada").length;
            const late = items.filter((a) => a.status !== "completada" && daysUntil(nextOccurrence(a)) < 0).length;
            const s = COMPANY_STYLES[c.color];

            return (
              <div
                key={c.id}
                onClick={() => {
                  if (onFilterCompany) {
                    onFilterCompany(c.id);
                  } else {
                    onNavigate("empresas");
                  }
                }}
                className="card-elevated cursor-pointer overflow-hidden bg-white dark:bg-[#101726] transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`h-2 ${s.bg}`} />
                <div className="p-4">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 truncate">{c.area}</p>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{pending}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">pendientes</p>
                    </div>
                    {late > 0 && (
                      <span className="rounded-full bg-rose-100 dark:bg-rose-950/70 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        {late} atrasada{late > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof CheckSquare;
  label: string;
  value: number;
  tone?: "default" | "warning" | "info" | "danger";
}) {
  const tones = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
    warning: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300",
    info: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300",
    danger: "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300",
  };
  return (
    <div className="card-elevated flex items-center gap-3.5 bg-white dark:bg-[#101726] p-4">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5.5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function SeeAllAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:underline"
    >
      {label} <ArrowRight className="size-3.5" />
    </button>
  );
}
