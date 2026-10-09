import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { daysUntil, nextOccurrence } from "@/lib/agenda/dates";
import {
  getNotificationPermission,
  requestNotificationPermission,
  scanAndNotifyActivities,
  sendSystemNotification,
  type NotificationPermissionState,
} from "@/lib/agenda/notifications";
import { COMPANY_STYLES } from "./badges";

export function NotificationCenter({
  onSelectActivity,
}: {
  onSelectActivity: (id: string) => void;
}) {
  const { visibleActivities, companyById, updateActivity } = useAgenda();
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Chequeo de actividades
  const now = new Date();
  const openActivities = visibleActivities.filter((a) => a.status !== "completada");

  const overdueList = openActivities.filter((a) => daysUntil(nextOccurrence(a, now), now) < 0);
  const todayList = openActivities.filter((a) => daysUntil(nextOccurrence(a, now), now) === 0);
  const upcomingMeetings = openActivities.filter((a) => {
    const n = daysUntil(nextOccurrence(a, now), now);
    return (a.type === "cita" || a.type === "reunion") && n >= 0 && n <= 1;
  });

  const totalAlerts = overdueList.length + upcomingMeetings.length;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);

    if (res === "granted") {
      // Disparar escaneo de notificaciones nativas de inmediato
      const result = scanAndNotifyActivities({
        activities: visibleActivities,
        companyById,
        onSelectActivity,
        force: true,
      });

      setTestSuccessMsg(
        `¡Permiso concedido! Se enviaron ${result.notificationsSent} alerta(s) nativas al sistema.`,
      );
      setTimeout(() => setTestSuccessMsg(null), 4000);
    }
  };

  const handleTriggerNativeAlerts = () => {
    const result = scanAndNotifyActivities({
      activities: visibleActivities,
      companyById,
      onSelectActivity,
      force: true,
    });

    if (result.notificationsSent > 0) {
      setTestSuccessMsg(
        `Se enviaron ${result.notificationsSent} alerta(s) del sistema al centro de notificaciones de tu equipo.`,
      );
    } else {
      // Enviar una de prueba si no hay vencidas
      sendSystemNotification("✅ Notificación de Nuestra Agenda", {
        body: "No tienes actividades vencidas en este momento. Todas las tareas están al día.",
      });
      setTestSuccessMsg("Se envió una notificación de verificación al sistema.");
    }
    setTimeout(() => setTestSuccessMsg(null), 4000);
  };

  const handleTestOverdueAlert = () => {
    const sample = overdueList[0] || {
      title: "Presentar SIPE mensual ante CSS",
      companyId: "mr",
    };
    const comp = companyById(sample.companyId);

    sendSystemNotification(`⚠️ Alerta: Tarea Atrasada - ${sample.title}`, {
      body: `Esta actividad de ${comp?.name ?? "M&R"} requiere atención urgente. Haz clic para resolverla.`,
      tag: "test-overdue",
      requireInteraction: true,
      onClick: () => {
        if ("id" in sample) onSelectActivity(sample.id);
      },
    });

    setTestSuccessMsg("Notificación de tarea vencida emitida a tu pantalla.");
    setTimeout(() => setTestSuccessMsg(null), 3500);
  };

  const handleTestMeetingAlert = () => {
    const sample = upcomingMeetings[0] || {
      title: "Cita con notaría — firma de escritura",
      time: "15:00",
      companyId: "ramac",
    };
    const comp = companyById(sample.companyId);

    sendSystemNotification(`📅 Próxima Cita Notarial: ${sample.title}`, {
      body: `Hora: ${sample.time ?? "15:00"} (${comp?.name ?? "RAMAC Consulting"}). Haz clic para revisar los documentos.`,
      tag: "test-meeting",
      onClick: () => {
        if ("id" in sample) onSelectActivity(sample.id);
      },
    });

    setTestSuccessMsg("Notificación de próxima cita emitida a tu pantalla.");
    setTimeout(() => setTestSuccessMsg(null), 3500);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex size-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 shadow-2xs"
        aria-label="Notificaciones del sistema"
        title="Centro de alertas y notificaciones del sistema"
      >
        <Bell className="size-4.5" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#1b2640] animate-pulse">
            {totalAlerts}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="card-elevated absolute right-0 mt-2 z-50 w-84 sm:w-96 overflow-hidden bg-white dark:bg-[#101726] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera */}
          <div className="bg-[#1b2640] dark:bg-[#0c1220] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-amber-300" />
                <h4 className="text-sm font-bold">Alertas y Notificaciones</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-300 hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-1 text-[11px] text-slate-300">
              Avisos nativos del navegador para tareas atrasadas y próximas citas
            </p>
          </div>

          {/* Estado de permisos de la API de Notificaciones */}
          <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
            {permission === "granted" ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Notificaciones del navegador activas</span>
                </div>
                <button
                  onClick={handleTriggerNativeAlerts}
                  className="cursor-pointer rounded-lg bg-[#1b2640] dark:bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#283759] dark:hover:bg-indigo-500"
                >
                  Verificar ahora
                </button>
              </div>
            ) : permission === "denied" ? (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 p-2 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ Las notificaciones están bloqueadas en tu navegador. Puedes habilitarlas en el candado de la barra de direcciones.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-tight">
                  Activa las notificaciones del sistema para recibir avisos flotantes en tu escritorio o celular:
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-800"
                >
                  <Volume2 className="size-3.5" />
                  Permitir Notificaciones del Navegador
                </button>
              </div>
            )}

            {testSuccessMsg && (
              <div className="mt-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-300 animate-in fade-in">
                {testSuccessMsg}
              </div>
            )}
          </div>

          {/* Botones de prueba interactiva */}
          {permission === "granted" && (
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#101726] px-3 py-2 text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Pruebas en vivo:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleTestOverdueAlert}
                  className="cursor-pointer font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Probar Vencida
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  onClick={handleTestMeetingAlert}
                  className="cursor-pointer font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  Probar Cita
                </button>
              </div>
            </div>
          )}

          {/* Listado de alertas pendientes */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {/* 1. TAREAS ATRASADAS */}
            {overdueList.length > 0 && (
              <div className="p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  <AlertTriangle className="size-3.5" />
                  Tareas Atrasadas ({overdueList.length})
                </div>
                {overdueList.map((a) => {
                  const comp = companyById(a.companyId);
                  const n = Math.abs(daysUntil(nextOccurrence(a, now), now));
                  return (
                    <div
                      key={a.id}
                      onClick={() => {
                        onSelectActivity(a.id);
                        setIsOpen(false);
                      }}
                      className="group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/40 p-2.5 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{a.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {comp?.name ?? "Personal"} · venció hace {n} día{n > 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateActivity(a.id, { status: "completada" });
                        }}
                        className="cursor-pointer shrink-0 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 px-2 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950"
                        title="Marcar como completada"
                      >
                        Completar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. PRÓXIMAS CITAS Y REUNIONES */}
            {upcomingMeetings.length > 0 && (
              <div className="p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  <Calendar className="size-3.5" />
                  Próximas Citas y Reuniones ({upcomingMeetings.length})
                </div>
                {upcomingMeetings.map((a) => {
                  const comp = companyById(a.companyId);
                  return (
                    <div
                      key={a.id}
                      onClick={() => {
                        onSelectActivity(a.id);
                        setIsOpen(false);
                      }}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/40 p-2.5 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{a.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {comp?.name ?? "Personal"} {a.time ? `· a las ${a.time}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold">
                        {a.type === "cita" ? "Cita" : "Reunión"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. TAREAS QUE VENCEN HOY */}
            {todayList.length > 0 && (
              <div className="p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  <Clock className="size-3.5" />
                  Vencen Hoy ({todayList.length})
                </div>
                {todayList.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectActivity(a.id);
                      setIsOpen(false);
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/40 p-2 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{a.title}</p>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">Hoy</span>
                  </div>
                ))}
              </div>
            )}

            {totalAlerts === 0 && todayList.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto mb-1.5 size-7 text-emerald-500" />
                <p className="font-bold text-slate-700 dark:text-slate-200">¡Al día! No tienes actividades vencidas.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Las citas y avisos aparecerán aquí automáticamente.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
