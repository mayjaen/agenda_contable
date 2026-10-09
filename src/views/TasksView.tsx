import { useMemo, useState } from "react";
import { CheckSquare, Plus, Search, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Priority, Status } from "@/lib/agenda/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/agenda/types";
import { nextOccurrence } from "@/lib/agenda/dates";
import { ActivityCard } from "@/components/agenda/ActivityCard";
import { COMPANY_STYLES } from "@/components/agenda/badges";
import { Chip, EmptyState, PageHeader } from "@/components/agenda/ui-bits";

const STATUSES: Status[] = ["pendiente", "en_progreso", "completada"];
const PRIORITIES: Priority[] = ["urgente", "alta", "media", "baja"];

export function TasksView({
  onSelectActivity,
  onNavigate,
  initialCompanyId,
  onCompanyChange,
}: {
  onSelectActivity: (id: string) => void;
  onNavigate: (tab: "crear") => void;
  initialCompanyId?: string | null;
  onCompanyChange?: (companyId: string | null) => void;
}) {
  const { visibleActivities, state, currentUser } = useAgenda();
  const [tab, setTab] = useState<"todas" | "mias" | "compartidas">("todas");
  const [company, setCompany] = useState<string | null>(initialCompanyId ?? null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "abiertas">("abiertas");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return visibleActivities
      .filter((a) => a.type !== "nota")
      .filter((a) => {
        if (tab === "mias") {
          return a.ownerId === currentUser.id || a.sharedWith.includes(currentUser.id);
        }
        if (tab === "compartidas") {
          return a.ownerId !== currentUser.id;
        }
        return true;
      })
      .filter((a) => (company ? a.companyId === company : true))
      .filter((a) => (status === "abiertas" ? a.status !== "completada" : a.status === status))
      .filter((a) => (priority ? a.priority === priority : true))
      .filter((a) => (owner ? a.ownerId === owner : true))
      .filter((a) => (ql ? (a.title + " " + a.description).toLowerCase().includes(ql) : true))
      .sort((x, y) => {
        if ((x.status === "completada") !== (y.status === "completada")) {
          return x.status === "completada" ? 1 : -1;
        }
        return nextOccurrence(x).localeCompare(nextOccurrence(y));
      });
  }, [visibleActivities, tab, company, status, priority, owner, q, currentUser.id]);

  const hasActiveFilters = !!(company || priority || owner || status !== "abiertas" || q);

  const clearFilters = () => {
    setCompany(null);
    onCompanyChange?.(null);
    setPriority(null);
    setOwner(null);
    setStatus("abiertas");
    setQ("");
  };

  return (
    <div>
      <PageHeader
        title="Tareas y pendientes"
        subtitle={`${list.length} ${list.length === 1 ? "actividad encontrada" : "actividades encontradas"}`}
        actions={
          <button
            onClick={() => onNavigate("crear")}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500"
          >
            <Plus className="size-4 stroke-[3]" /> Nueva tarea
          </button>
        }
      />

      {/* Pestañas principales */}
      <div className="flex gap-1.5 rounded-2xl bg-white dark:bg-[#101726] p-1.5 shadow-xs border border-slate-200 dark:border-slate-800 sm:w-fit">
        <button
          onClick={() => setTab("todas")}
          className={`flex-1 cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            tab === "todas" ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Todas las tareas
        </button>
        <button
          onClick={() => setTab("mias")}
          className={`flex-1 cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            tab === "mias" ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Mis tareas ({currentUser.name})
        </button>
        <button
          onClick={() => setTab("compartidas")}
          className={`flex-1 cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            tab === "compartidas" ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Compartidas conmigo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título, cliente o descripción…"
          className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden shadow-xs"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filtros por Empresa y Estados */}
      <div className="mt-4 space-y-2.5">
        {/* Fila 1: Empresas */}
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip
            active={!company}
            onClick={() => {
              setCompany(null);
              onCompanyChange?.(null);
            }}
          >
            Todas las empresas
          </Chip>
          {state.companies.map((c) => (
            <Chip
              key={c.id}
              active={company === c.id}
              onClick={() => {
                const next = company === c.id ? null : c.id;
                setCompany(next);
                onCompanyChange?.(next);
              }}
            >
              <span className={`size-2 rounded-full ${COMPANY_STYLES[c.color].dot}`} />
              {c.name}
            </Chip>
          ))}
        </div>

        {/* Fila 2: Estados, Prioridades y Responsables */}
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={status === "abiertas"} onClick={() => setStatus("abiertas")}>
            Abiertas
          </Chip>
          {STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? "abiertas" : s)}>
              {STATUS_LABELS[s]}
            </Chip>
          ))}

          <span className="mx-1 h-4 w-px shrink-0 bg-slate-300 dark:bg-slate-700" />

          {PRIORITIES.map((p) => (
            <Chip key={p} active={priority === p} onClick={() => setPriority(priority === p ? null : p)}>
              {PRIORITY_LABELS[p]}
            </Chip>
          ))}

          <span className="mx-1 h-4 w-px shrink-0 bg-slate-300 dark:bg-slate-700" />

          {state.users.map((u) => (
            <Chip key={u.id} active={owner === u.id} onClick={() => setOwner(owner === u.id ? null : u.id)}>
              {u.name}
            </Chip>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="mt-6 space-y-2.5">
        {list.length ? (
          list.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              onClick={() => onSelectActivity(a.id)}
            />
          ))
        ) : (
          <EmptyState
            icon={CheckSquare}
            title="No se encontraron tareas con estos filtros"
            description="Intenta cambiar los filtros seleccionados o el término de búsqueda."
            action={
              <button
                onClick={() => onNavigate("crear")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                <Plus className="size-4 stroke-[3]" /> Crear nueva actividad
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
