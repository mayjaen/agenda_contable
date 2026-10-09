/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modelo de datos oficial y escalable de Nuestra Agenda.
 * Diseñado para despliegue en hosting web con seguridad reforzada,
 * soporte multiempresa, base de datos relacional y certificados SSL.
 */

export type ActivityType = "tarea" | "reunion" | "cita" | "recordatorio" | "nota" | "vencimiento";
export type Priority = "baja" | "media" | "alta" | "urgente";
export type Status = "pendiente" | "en_progreso" | "completada";
export type Visibility = "privada" | "compartida" | "empresa";
export type Reminder = "mismo_dia" | "1_dia" | "3_dias";
export type Recurrence = "ninguna" | "semanal" | "mensual" | "anual";
export type Role = "admin" | "miembro";
export type CompanyColor = "solidez" | "mr" | "ramac" | "plp" | "personal";
export type ThemeMode = "light" | "dark";

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  phone?: string;
  title?: string; // Cargo o puesto (ej. Gerente Contable, Abogada, Asesor Inmobiliario)
  passwordHash?: string; // Hash SHA-256 criptográfico (nunca texto plano en código)
  salt?: string;
  primaryCompanyId?: string;
  avatarColor?: string;
  twoFactorEnabled?: boolean;
}

export interface Company {
  id: string;
  name: string;
  area: string;
  color: CompanyColor;
  memberIds: string[];
  description?: string;
  ruc?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  companyId: string | null; // null = personal
  ownerId: string;
  sharedWith: string[];
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  priority: Priority;
  status: Status;
  visibility: Visibility;
  reminders: Reminder[];
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  companyId: string | null;
  authorId: string;
  createdAt: string;
  convertedActivityId?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdBy?: string;
}

export type IncidentKind = "error_tecnico" | "permiso_acceso" | "recordatorios" | "mejora_solicitud";
export type IncidentSeverity = "leve" | "media" | "critica";
export type IncidentStatus = "abierto" | "en_revision" | "resuelto";

export interface SupportIncident {
  id: string;
  code: string; // Ej. INC-2026-001
  memberId: string;
  kind: IncidentKind;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  message: string;
  page?: string;
  device?: string;
  browser?: string;
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export interface IntegrationSettings {
  emailAlerts: {
    enabled: boolean;
    dailyDigest: boolean;
    digestTime: string; // "08:00"
    onTaskAssigned: boolean;
    onLegalDeadlines: boolean; // SIPE / ITBMS
    emailRecipient?: string;
  };
  calendarSync: {
    googleCalendarEnabled: boolean;
    outlookEnabled: boolean;
    iCalSubscriptionUrl: string;
    lastSyncedAt?: string;
  };
  mobilePush: {
    enabled: boolean;
    permissionGranted: boolean;
    remindDueToday: boolean;
    remindMeetingsAhead: boolean; // 15 min antes
    remindOverdue: boolean;
  };
}

export interface QuickReminder {
  id: string;
  title: string;
  dueTime?: string; // HH:mm
  dueDate: string; // YYYY-MM-DD
  companyId?: string | null;
  completed: boolean;
  notifyOnBrowser?: boolean;
  notified?: boolean;
  createdAt: string;
}

/** Configuración de Base de Datos para el Hosting Web (sin contraseñas quemadas) */
export interface DatabaseConfig {
  type: "postgresql" | "mysql" | "supabase" | "cloudsql";
  host: string;
  port: number;
  database: string;
  user: string;
  passwordMasked: string; // Representación enmascarada (***)
  sslMode: "require" | "prefer" | "disable";
  connectionStringMasked: string;
  status: "connected" | "disconnected" | "testing";
  lastTestedAt?: string;
  environmentVarName: string; // Ej: DATABASE_URL
}

/** Configuración de Certificado SSL / HTTPS para cualquier Hosting */
export interface SslConfig {
  domain: string;
  issuer: string; // Ej: Let's Encrypt / DigiCert / Cloudflare
  validFrom: string;
  validTo: string;
  autoRenew: boolean;
  forceHttps: boolean;
  hstsEnabled: boolean;
  status: "active" | "pending" | "expired";
  certPem: string; // Certificado CRT / PEM público
  keyPem: string; // Clave privada enmascarada
  caBundlePem: string; // Certificados intermedios CA
}

/** Registro de Auditoría y Seguridad del Sistema */
export interface AdminLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ip: string;
  severity: "info" | "warning" | "security";
  details?: string;
}

export interface AgendaState {
  currentUserId: string;
  orgId: string;
  orgName: string;
  organizations: Organization[];
  users: User[];
  companies: Company[];
  activities: Activity[];
  notes: Note[];
  incidents: SupportIncident[];
  integrations: IntegrationSettings;
  quickReminders: QuickReminder[];
  dbConfig: DatabaseConfig;
  sslConfig: SslConfig;
  adminLogs: AdminLog[];
  themeMode: ThemeMode;
  isAuthenticated: boolean;
}

export const TYPE_LABELS: Record<ActivityType, string> = {
  tarea: "Tarea",
  reunion: "Reunión",
  cita: "Cita",
  recordatorio: "Recordatorio",
  nota: "Nota",
  vencimiento: "Vencimiento",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

export const STATUS_LABELS: Record<Status, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  privada: "Privada",
  compartida: "Compartida",
  empresa: "Empresa / Equipo",
};

export const REMINDER_LABELS: Record<Reminder, string> = {
  "3_dias": "3 días antes",
  "1_dia": "1 día antes",
  mismo_dia: "El mismo día",
};

export const REMINDER_OFFSET: Record<Reminder, number> = {
  "3_dias": 3,
  "1_dia": 1,
  mismo_dia: 0,
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  ninguna: "No se repite",
  semanal: "Cada semana",
  mensual: "Cada mes",
  anual: "Cada año",
};

export const INCIDENT_KINDS: Record<IncidentKind, { label: string; desc: string }> = {
  error_tecnico: { label: "Error técnico / Bug", desc: "La página no responde, error al guardar o pantalla trabada" },
  permiso_acceso: { label: "Permisos y Acceso", desc: "No puedo ver una empresa, integrante o actividad" },
  recordatorios: { label: "Recordatorios y Alertas", desc: "Avisos por correo o notificaciones no recibidas" },
  mejora_solicitud: { label: "Solicitud de mejora", desc: "Idea o ajuste para optimizar el flujo de trabajo" },
};

export const INCIDENT_SEVERITY: Record<IncidentSeverity, { label: string; badge: string }> = {
  leve: { label: "Baja / Consulta", badge: "bg-blue-100 text-blue-800" },
  media: { label: "Media / Moderada", badge: "bg-amber-100 text-amber-900" },
  critica: { label: "Crítica / Bloqueante", badge: "bg-rose-100 text-rose-800" },
};
