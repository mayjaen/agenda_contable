import { useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Send,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { PageHeader, SectionTitle } from "@/components/agenda/ui-bits";
import { toKey } from "@/lib/agenda/dates";

export function IntegrationsView() {
  const { state, currentUser, updateIntegrations, triggerPushNotification, visibleActivities, companyById } =
    useAgenda();

  const integrations = state.integrations;
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);

  // Generador de archivo iCal (.ics) para sincronización con Google Calendar / Outlook
  const handleDownloadICal = () => {
    const calendarEvents = visibleActivities
      .filter((a) => a.type !== "nota")
      .map((a) => {
        const cleanDate = a.date.replace(/-/g, "");
        const startTime = a.time ? `${cleanDate}T${a.time.replace(":", "")}00` : cleanDate;
        const endTime = a.time
          ? `${cleanDate}T${String(Number(a.time.slice(0, 2)) + 1).padStart(2, "0")}${a.time.slice(3, 5)}00`
          : cleanDate;
        const company = companyById(a.companyId);

        return [
          "BEGIN:VEVENT",
          `UID:${a.id}@nuestraagenda.app`,
          `DTSTAMP:${cleanDate}T120000Z`,
          `DTSTART:${startTime}`,
          `DTEND:${endTime}`,
          `SUMMARY:${a.title} (${company?.name ?? "Personal"})`,
          `DESCRIPTION:${(a.description || "").replace(/\n/g, "\\n")}`,
          `STATUS:${a.status === "completada" ? "COMPLETED" : "CONFIRMED"}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    const icsFile = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nuestra Agenda//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:Nuestra Agenda - ${state.orgName}`,
      "X-WR-TIMEZONE:America/Panama",
      calendarEvents,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsFile], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `agenda_calendario_${toKey(new Date())}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyFeedUrl = () => {
    const url = integrations.calendarSync.iCalSubscriptionUrl;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTestPushNotification = async () => {
    const success = await triggerPushNotification(
      "🔔 Recordatorio de Nuestra Agenda",
      "Tienes 3 actividades programadas para hoy, incluyendo el seguimiento del SIPE mensual.",
    );
    if (success) {
      setPushStatusMsg("¡Notificación enviada con éxito al sistema!");
    } else {
      setPushStatusMsg("Notificación bloqueada o no permitida por el navegador. Revisa los permisos.");
    }
    setTimeout(() => setPushStatusMsg(null), 3500);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Canales de Notificación y Sincronización"
        subtitle="Configura alertas automatizadas por correo, sincroniza tu calendario con Google/Outlook y activa notificaciones en tu celular."
      />

      {/* 1. MÓDULO: AVISO POR CORREO ELECTRÓNICO */}
      <section className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Mail className="size-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Avisos y Alertas por Correo Electrónico</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Envío de recordatorios y resúmenes al buzón del equipo</p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={integrations.emailAlerts.enabled}
              onChange={(e) =>
                updateIntegrations({
                  emailAlerts: { ...integrations.emailAlerts, enabled: e.target.checked },
                })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1b2640] dark:peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
            <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {integrations.emailAlerts.enabled ? "Activado" : "Pausado"}
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.emailAlerts.dailyDigest}
                onChange={(e) =>
                  updateIntegrations({
                    emailAlerts: { ...integrations.emailAlerts, dailyDigest: e.target.checked },
                  })
                }
                className="size-4 rounded text-[#1b2640]"
              />
              <span>Resumen matutino diario con pendientes a las 08:00 AM</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.emailAlerts.onTaskAssigned}
                onChange={(e) =>
                  updateIntegrations({
                    emailAlerts: { ...integrations.emailAlerts, onTaskAssigned: e.target.checked },
                  })
                }
                className="size-4 rounded text-[#1b2640]"
              />
              <span>Aviso inmediato cuando me asignen o compartan una actividad</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.emailAlerts.onLegalDeadlines}
                onChange={(e) =>
                  updateIntegrations({
                    emailAlerts: { ...integrations.emailAlerts, onLegalDeadlines: e.target.checked },
                  })
                }
                className="size-4 rounded text-[#1b2640]"
              />
              <span>Alerta crítica de vencimientos fiscales y legales (SIPE, ITBMS ante CSS/DGI)</span>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Correo receptor asignado</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.email}</p>
            </div>

            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Send className="size-3.5 text-indigo-600 dark:text-indigo-400" /> Previsualizar plantilla de correo
            </button>
          </div>
        </div>
      </section>

      {/* 2. MÓDULO: SINCRONIZACIÓN CON GOOGLE CALENDAR / OUTLOOK */}
      <section className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            <Calendar className="size-6" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sincronización con Google Calendar y Outlook</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mantén tus reuniones, audiencias y vencimientos visibles en tu calendario personal o corporativo
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Opción A: Descarga iCal (.ics) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Opción 1: Archivo de Calendario (.ics)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Descarga un archivo universal con todas tus actividades que puedes importar en Google Calendar, Apple Calendar o Microsoft Outlook.
            </p>
            <button
              onClick={handleDownloadICal}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1b2640] dark:bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500"
            >
              <Download className="size-4" /> Descargar archivo iCal (.ics)
            </button>
          </div>

          {/* Opción B: Suscripción en vivo por URL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Opción 2: Enlace de Suscripción en Vivo (WebCal)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Copia este enlace en tu Google Calendar o Outlook para que los eventos se sincronicen de forma continua:
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={integrations.calendarSync.iCalSubscriptionUrl}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-200"
              />
              <button
                onClick={handleCopyFeedUrl}
                className="cursor-pointer shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Copiar URL"
              >
                {copiedLink ? <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Formato estándar compatible con Google Workspace, Microsoft 365 y Apple iOS.</span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Estado: Activo</span>
        </div>
      </section>

      {/* 3. MÓDULO: NOTIFICACIONES EN EL CELULAR */}
      <section className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Smartphone className="size-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Notificaciones Push en el Celular y Navegador</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Recibe recordatorios directos en la pantalla de bloqueo y barra de avisos</p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={integrations.mobilePush.enabled}
              onChange={(e) =>
                updateIntegrations({
                  mobilePush: { ...integrations.mobilePush, enabled: e.target.checked },
                })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full" />
            <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {integrations.mobilePush.enabled ? "Activado" : "Pausado"}
            </span>
          </label>
        </div>

        {pushStatusMsg && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 p-3 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            {pushStatusMsg}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.mobilePush.remindDueToday}
                onChange={(e) =>
                  updateIntegrations({
                    mobilePush: { ...integrations.mobilePush, remindDueToday: e.target.checked },
                  })
                }
                className="size-4 rounded text-emerald-600"
              />
              <span>Avisar de actividades que vencen hoy al desbloquear el celular</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.mobilePush.remindMeetingsAhead}
                onChange={(e) =>
                  updateIntegrations({
                    mobilePush: { ...integrations.mobilePush, remindMeetingsAhead: e.target.checked },
                  })
                }
                className="size-4 rounded text-emerald-600"
              />
              <span>Alerta con 15 minutos de anticipación para reuniones y citas notariales</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={integrations.mobilePush.remindOverdue}
                onChange={(e) =>
                  updateIntegrations({
                    mobilePush: { ...integrations.mobilePush, remindOverdue: e.target.checked },
                  })
                }
                className="size-4 rounded text-emerald-600"
              />
              <span>Avisos de advertencia para tareas atrasadas sin completar</span>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-2.5 flex flex-col justify-center">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
              Prueba la API nativa de Notificaciones del Navegador en este dispositivo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const { scanAndNotifyActivities } = await import("@/lib/agenda/notifications");
                  const res = scanAndNotifyActivities({
                    activities: visibleActivities,
                    companyById,
                    force: true,
                  });
                  setPushStatusMsg(`¡Escaneo ejecutado! Se emitieron ${res.notificationsSent} alertas nativas del sistema.`);
                  setTimeout(() => setPushStatusMsg(null), 3500);
                }}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1b2640] dark:bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                <Bell className="size-3.5 text-amber-300" /> Escanear y alertar vencidas
              </button>

              <button
                type="button"
                onClick={handleTestPushNotification}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <Smartphone className="size-3.5" /> Enviar push de prueba
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Previsualización de Correo HTML */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-elevated max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Previsualización del Correo de Alerta</h4>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Plantilla de correo simulada */}
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1">
                <p><strong>De:</strong> Nuestra Agenda &lt;notificaciones@nuestraagenda.app&gt;</p>
                <p><strong>Para:</strong> {currentUser.name} &lt;{currentUser.email}&gt;</p>
                <p><strong>Asunto:</strong> [Recordatorio Urgente] Vencimiento de SIPE Mensual - M&R</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-sm text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-extrabold text-base">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#1b2640] dark:bg-indigo-600 text-white text-xs">
                    N
                  </span>
                  Nuestra Agenda — Coordinación Corporativa
                </div>

                <p>Estimada(o) <strong>{currentUser.name}</strong>,</p>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Te recordamos que tienes una actividad prioritaria programada para entrega próxima en tu empresa <strong>M&R</strong>:
                </p>

                <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 p-3.5 space-y-1">
                  <p className="font-extrabold text-slate-900 dark:text-white">Presentar SIPE mensual ante la CSS</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Fecha límite: 15 de cada mes a las 10:00 AM</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Prioridad: <strong>Urgente</strong> | Asignado a: Liz</p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Puedes ingresar a la aplicación para marcarla como completada o revisar los documentos adjuntos.
                </p>

                <div className="pt-2">
                  <span className="inline-block rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2 text-xs font-bold text-white">
                    Abrir Nuestra Agenda
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="cursor-pointer rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
