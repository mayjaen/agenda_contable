import type { Activity, Company } from "./types";
import { daysUntil, nextOccurrence } from "./dates";

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    return perm as NotificationPermissionState;
  } catch (err) {
    console.warn("Error al solicitar permisos de notificación:", err);
    return Notification.permission as NotificationPermissionState;
  }
}

export function sendSystemNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void },
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notif = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    if (options?.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    return notif;
  } catch (err) {
    console.warn("No se pudo emitir la notificación del sistema:", err);
    return null;
  }
}

/**
 * Escanea la lista de actividades para alertar sobre:
 * 1. Tareas vencidas / atrasadas.
 * 2. Tareas que vencen hoy.
 * 3. Próximas citas y reuniones (hoy o en las próximas 24 horas).
 */
export function scanAndNotifyActivities({
  activities,
  companyById,
  onSelectActivity,
  force = false,
}: {
  activities: Activity[];
  companyById: (id: string | null) => Company | undefined;
  onSelectActivity?: (id: string) => void;
  force?: boolean;
}): {
  overdueCount: number;
  todayCount: number;
  upcomingMeetingsCount: number;
  notificationsSent: number;
} {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return { overdueCount: 0, todayCount: 0, upcomingMeetingsCount: 0, notificationsSent: 0 };
  }

  let sent = 0;
  const overdueList: Activity[] = [];
  const todayList: Activity[] = [];
  const upcomingMeetingsList: Activity[] = [];

  const now = new Date();

  for (const a of activities) {
    if (a.status === "completada") continue;

    const nextDate = nextOccurrence(a, now);
    const n = daysUntil(nextDate, now);

    // 1. Tareas atrasadas
    if (n < 0) {
      overdueList.push(a);
    }
    // 2. Vencen hoy
    else if (n === 0) {
      todayList.push(a);
      if (a.type === "cita" || a.type === "reunion") {
        upcomingMeetingsList.push(a);
      }
    }
    // 3. Citas o reuniones de mañana
    else if (n === 1 && (a.type === "cita" || a.type === "reunion")) {
      upcomingMeetingsList.push(a);
    }
  }

  // Notificar tareas atrasadas más críticas
  for (const a of overdueList.slice(0, 2)) {
    const storageKey = `notif_overdue_${a.id}_${a.date}`;
    if (!force && typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
      continue;
    }

    const company = companyById(a.companyId);
    const nDays = Math.abs(daysUntil(nextOccurrence(a, now), now));

    sendSystemNotification(`⚠️ Tarea Atrasada: ${a.title}`, {
      body: `Esta actividad de ${company?.name ?? "Personal"} venció hace ${nDays} día${
        nDays > 1 ? "s" : ""
      }. Haz clic para gestionarla.`,
      tag: `overdue-${a.id}`,
      onClick: () => onSelectActivity?.(a.id),
    });

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
    sent++;
  }

  // Notificar citas o reuniones próximas
  for (const a of upcomingMeetingsList.slice(0, 2)) {
    const storageKey = `notif_meeting_${a.id}_${a.date}`;
    if (!force && typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
      continue;
    }

    const company = companyById(a.companyId);
    const timeLabel = a.time ? ` a las ${a.time}` : "";

    sendSystemNotification(
      `📅 ${a.type === "cita" ? "Próxima Cita" : "Próxima Reunión"}: ${a.title}`,
      {
        body: `Programada para hoy${timeLabel} (${company?.name ?? "Personal"}). Haz clic para ver detalles.`,
        tag: `meeting-${a.id}`,
        onClick: () => onSelectActivity?.(a.id),
      },
    );

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
    sent++;
  }

  // Notificar tareas del día si no hubo citas
  if (sent === 0 && todayList.length > 0) {
    const firstToday = todayList[0];
    if (firstToday) {
      const storageKey = `notif_today_${firstToday.id}_${firstToday.date}`;
      if (force || (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(storageKey))) {
        const company = companyById(firstToday.companyId);
        sendSystemNotification(`🔔 Pendiente para hoy: ${firstToday.title}`, {
          body: `Tienes ${todayList.length} actividad${
            todayList.length > 1 ? "es" : ""
          } agendada${todayList.length > 1 ? "s" : ""} para hoy (${company?.name ?? "Personal"}).`,
          tag: `today-${firstToday.id}`,
          onClick: () => onSelectActivity?.(firstToday.id),
        });

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(storageKey, "true");
        }
        sent++;
      }
    }
  }

  return {
    overdueCount: overdueList.length,
    todayCount: todayList.length,
    upcomingMeetingsCount: upcomingMeetingsList.length,
    notificationsSent: sent,
  };
}
