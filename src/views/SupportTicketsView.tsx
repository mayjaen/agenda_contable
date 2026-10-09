import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  LifeBuoy,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { IncidentStatus } from "@/lib/agenda/types";
import { INCIDENT_KINDS, INCIDENT_SEVERITY } from "@/lib/agenda/types";
import { Avatar } from "@/components/agenda/badges";
import { EmptyState, PageHeader } from "@/components/agenda/ui-bits";

export function SupportTicketsView({
  onOpenReportModal,
}: {
  onOpenReportModal: () => void;
}) {
  const { state, currentUser, userById, updateIncidentStatus, deleteIncident } = useAgenda();
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [q, setQ] = useState("");
  const isAdmin = currentUser.role === "admin";
  const incidents = state.incidents || [];

  const filtered = incidents
    .filter((inc) => (filterStatus === "todos" ? true : inc.status === filterStatus))
    .filter(
      (inc) =>
        q.trim() === "" ||
        inc.title.toLowerCase().includes(q.toLowerCase()) ||
        inc.code.toLowerCase().includes(q.toLowerCase()) ||
        inc.message.toLowerCase().includes(q.toLowerCase()),
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Mesa de Soporte & Incidentes"
        subtitle="Seguimiento de reportes técnicos, problemas de acceso o solicitudes operativas reportadas por el equipo."
        actions={
          <button
            onClick={onOpenReportModal}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            <Plus className="size-4 stroke-[3]" /> Reportar nuevo incidente
          </button>
        }
      />

      {/* Métricas rápidas de tickets */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-[11px] font-bold text-rose-800 uppercase">Incidentes Abiertos</p>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {incidents.filter((i) => i.status === "abierto").length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-[11px] font-bold text-amber-800 uppercase">En Revisión Técnica</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {incidents.filter((i) => i.status === "en_revision").length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-[11px] font-bold text-emerald-800 uppercase">Resueltos</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {incidents.filter((i) => i.status === "resuelto").length}
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 rounded-2xl bg-white dark:bg-[#101726] p-1.5 shadow-xs border border-slate-200 dark:border-slate-800">
          {[
            { id: "todos", label: "Todos" },
            { id: "abierto", label: "Abiertos" },
            { id: "en_revision", label: "En Revisión" },
            { id: "resuelto", label: "Resueltos" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                filterStatus === f.id
                  ? "bg-[#1b2640] dark:bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="size-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código o descripción…"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Lista de incidentes */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No hay tickets en esta categoría"
          description="Todos los reportes están atendidos o no coinciden con los filtros aplicados."
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((inc) => {
            const author = userById(inc.memberId);
            const kindInfo = INCIDENT_KINDS[inc.kind] || { label: inc.kind };
            const sevInfo = INCIDENT_SEVERITY[inc.severity] || { label: inc.severity, badge: "bg-slate-100 text-slate-700" };

            return (
              <div
                key={inc.id}
                className={`card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-5 transition-all shadow-xs ${
                  inc.status === "resuelto" ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/40" : ""
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#1b2640] dark:text-indigo-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {inc.code}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sevInfo.badge}`}>
                        Severidad: {sevInfo.label}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {kindInfo.label}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{inc.title}</h3>
                  </div>

                  {/* Estado del ticket */}
                  <div className="flex items-center gap-2">
                    <select
                      value={inc.status}
                      onChange={(e) => updateIncidentStatus(inc.id, e.target.value as IncidentStatus)}
                      className={`cursor-pointer rounded-xl border px-3 py-1 text-xs font-bold ${
                        inc.status === "resuelto"
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : inc.status === "en_revision"
                          ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          : "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                      }`}
                    >
                      <option value="abierto">● Abierto</option>
                      <option value="en_revision">◐ En revisión</option>
                      <option value="resuelto">✓ Resuelto</option>
                    </select>

                    {isAdmin && (
                      <button
                        onClick={() => deleteIncident(inc.id)}
                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Eliminar reporte"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {inc.message}
                </p>

                {inc.adminNotes && (
                  <div className="mt-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 text-xs text-indigo-900 dark:text-indigo-200">
                    <span className="font-bold">Respuesta del Soporte Técnico:</span> {inc.adminNotes}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-2">
                    {author && <Avatar name={author.name} initials={author.initials} size="sm" />}
                    <span>
                      Reportado por <strong className="text-slate-700 dark:text-slate-300">{author?.name || "Usuario"}</strong>
                    </span>
                    <span>·</span>
                    <span>{format(new Date(inc.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <span>{inc.device}</span>
                    <span>·</span>
                    <span>Pantalla: {inc.page}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
