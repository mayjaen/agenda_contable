import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Activity } from "./types";
import { REMINDER_OFFSET } from "./types";

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromKey = (k: string) => parseISO(k);
export const todayKey = () => toKey(new Date());

export function fmtLong(d: Date | string) {
  const date = typeof d === "string" ? fromKey(d) : d;
  return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}
export function fmtShort(d: Date | string) {
  const date = typeof d === "string" ? fromKey(d) : d;
  return format(date, "d MMM", { locale: es });
}
export function fmtMedium(d: Date | string) {
  const date = typeof d === "string" ? fromKey(d) : d;
  return format(date, "EEE d MMM", { locale: es });
}
export function fmtMonth(d: Date) {
  return format(d, "MMMM yyyy", { locale: es });
}
export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Días desde hoy hasta la fecha (negativo = ya pasó). */
export function daysUntil(dateKey: string, from = new Date()) {
  return differenceInCalendarDays(fromKey(dateKey), startOfDay(from));
}

export function relativeLabel(dateKey: string) {
  const n = daysUntil(dateKey);
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === -1) return "Ayer";
  if (n < 0) return `Hace ${Math.abs(n)} días`;
  return `En ${n} días`;
}

function step(date: Date, rec: Activity["recurrence"], n: number) {
  switch (rec) {
    case "semanal":
      return addWeeks(date, n);
    case "mensual":
      return addMonths(date, n);
    case "anual":
      return addYears(date, n);
    default:
      return date;
  }
}

/**
 * Fechas (YYYY-MM-DD) en las que la actividad ocurre dentro del rango,
 * expandiendo la recurrencia.
 */
export function occurrencesInRange(a: Activity, start: Date, end: Date): string[] {
  const base = fromKey(a.date);
  if (a.recurrence === "ninguna") {
    return !isBefore(base, startOfDay(start)) && !isAfter(base, end) ? [a.date] : [];
  }
  const out: string[] = [];
  for (let i = 0; i < 400; i++) {
    const d = step(base, a.recurrence, i);
    if (isAfter(d, end)) break;
    if (!isBefore(d, startOfDay(start))) out.push(toKey(d));
  }
  return out;
}

/** Próxima ocurrencia a partir de hoy (o la fecha original si no se repite). */
export function nextOccurrence(a: Activity, from = new Date()): string {
  if (a.recurrence === "ninguna") return a.date;
  const base = fromKey(a.date);
  const today = startOfDay(from);
  for (let i = 0; i < 400; i++) {
    const d = step(base, a.recurrence, i);
    if (!isBefore(d, today)) return toKey(d);
  }
  return a.date;
}

/** Verdadero si hoy corresponde a alguno de los recordatorios configurados. */
export function reminderFiresToday(a: Activity, from = new Date()) {
  if (a.status === "completada") return false;
  const next = nextOccurrence(a, from);
  const n = daysUntil(next, from);
  return a.reminders.some((r) => REMINDER_OFFSET[r] === n);
}

export function dueSoon(a: Activity, from = new Date()) {
  if (a.status === "completada") return false;
  const n = daysUntil(nextOccurrence(a, from), from);
  return n >= 0 && n <= 3;
}

export function overdue(a: Activity, from = new Date()) {
  if (a.status === "completada") return false;
  return daysUntil(nextOccurrence(a, from), from) < 0;
}

export const shiftDay = (d: Date, n: number) => addDays(d, n);
