import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle, LifeBuoy, Wrench, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { IncidentKind, IncidentSeverity } from "@/lib/agenda/types";
import { INCIDENT_KINDS, INCIDENT_SEVERITY } from "@/lib/agenda/types";

export function SupportIncidentModal({
  isOpen,
  onClose,
  currentPage = "/",
  onViewTickets,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  onViewTickets?: () => void;
}) {
  const { currentUser, addIncident } = useAgenda();
  const [kind, setKind] = useState<IncidentKind>("error_tecnico");
  const [severity, setSeverity] = useState<IncidentSeverity>("media");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const ticket = addIncident({
      memberId: currentUser.id,
      kind,
      severity,
      title: title.trim(),
      message: message.trim(),
      page: currentPage,
      device: typeof window !== "undefined" && window.innerWidth < 768 ? "Móvil / Celular" : "Computadora de escritorio",
      browser: typeof navigator !== "undefined" ? navigator.userAgent.split(" ").slice(-2).join(" ") : "Navegador Web",
    });

    setGeneratedCode(ticket.code);
  };

  const handleResetAndClose = () => {
    setGeneratedCode(null);
    setTitle("");
    setMessage("");
    setSeverity("media");
    setKind("error_tecnico");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="card-elevated max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Módulo de Soporte & Reporte de Incidentes</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Envía un reporte directo al equipo de soporte de la plataforma</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {generatedCode ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="size-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">¡Incidente Reportado con Éxito!</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tu reporte ha sido registrado en la mesa de ayuda con el código:
              </p>
              <div className="mt-2.5 inline-block rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 font-mono text-base font-black text-emerald-800 dark:text-emerald-300">
                {generatedCode}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              El administrador técnico ha recibido los detalles del evento junto con los diagnósticos de tu navegador y página actual.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                Aceptar y cerrar
              </button>
              {onViewTickets && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                    onViewTickets();
                  }}
                  className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Ver todos los tickets
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Tipo de incidente */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tipo de incidente o problema:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(INCIDENT_KINDS) as IncidentKind[]).map((k) => {
                  const info = INCIDENT_KINDS[k];
                  const isSelected = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`cursor-pointer rounded-xl border p-2.5 text-left text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-bold">{info.label}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                        {info.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severidad */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Nivel de impacto / Severidad:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(INCIDENT_SEVERITY) as IncidentSeverity[]).map((sev) => {
                  const isSel = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`cursor-pointer rounded-xl border p-2 text-center text-xs font-bold transition-colors ${
                        isSel
                          ? sev === "critica"
                            ? "border-rose-600 bg-rose-600 text-white"
                            : sev === "media"
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {INCIDENT_SEVERITY[sev].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asunto / Título */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Resumen breve del incidente <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Error al intentar guardar una actividad en M&R"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Descripción detallada */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descripción detallada de lo ocurrido <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explica qué acción realizaste, qué mensaje de error apareció o qué comportamiento inesperado sucedió…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Diagnóstico del sistema capturado */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                <Wrench className="size-3 text-slate-400 dark:text-slate-500" />
                Diagnóstico del entorno (captura automática):
              </div>
              <p>• <strong>Pantalla afectada:</strong> {currentPage}</p>
              <p>• <strong>Usuario:</strong> {currentUser.name} ({currentUser.email})</p>
              <p>• <strong>Fecha/Hora:</strong> {new Date().toLocaleString("es")}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Atención 24/7 por mesa de ayuda</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                >
                  Enviar reporte de incidente
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
