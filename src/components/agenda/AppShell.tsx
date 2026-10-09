/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shell Principal de la Aplicación (AppShell).
 * Provee la navegación lateral ejecutiva, barra superior adaptativa,
 * controles de modo oscuro, centro de notificaciones nativas y accesos rápidos.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Home,
  LifeBuoy,
  LogOut,
  Moon,
  Plus,
  Printer,
  Radio,
  Server,
  ShieldCheck,
  StickyNote,
  Sun,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { scanAndNotifyActivities } from "@/lib/agenda/notifications";
import { Breadcrumbs } from "./Breadcrumbs";
import { Avatar } from "./badges";
import { NotificationCenter } from "./NotificationCenter";
import { SupportIncidentModal } from "./SupportIncidentModal";
import { UserSwitcherModal } from "./UserSwitcher";

export type NavTab =
  | "inicio"
  | "calendario"
  | "tareas"
  | "notas"
  | "empresas"
  | "equipo"
  | "imprimir"
  | "integraciones"
  | "soporte"
  | "perfil"
  | "admin"
  | "crear";

interface NavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "tareas", label: "Tareas y pendientes", icon: CheckSquare },
  { id: "notas", label: "Notas rápidas", icon: StickyNote },
];

const ORGANIZATION_NAV: NavItem[] = [
  { id: "empresas", label: "Empresas y áreas", icon: Building2 },
  { id: "equipo", label: "Equipo y permisos", icon: Users },
  { id: "imprimir", label: "Imprimir / Exportar", icon: Printer },
  { id: "integraciones", label: "Avisos, Calendar & Celular", icon: Radio, badge: "Push" },
];

const SYSTEM_NAV: NavItem[] = [
  { id: "perfil", label: "Mi perfil y seguridad", icon: UserCheck },
  { id: "soporte", label: "Mesa de soporte & tickets", icon: LifeBuoy },
  { id: "admin", label: "Panel Administrador", icon: Server, badge: "SSL/DB", adminOnly: true },
];

export function AppShell({
  activeTab,
  selectedCompanyId,
  selectedActivityTitle,
  onNavigate,
  onSelectCompany,
  onSelectActivity,
  children,
}: {
  activeTab: NavTab;
  selectedCompanyId?: string | null;
  selectedActivityTitle?: string | null;
  onNavigate: (tab: NavTab) => void;
  onSelectCompany?: (companyId: string | null) => void;
  onSelectActivity: (id: string) => void;
  children: ReactNode;
}) {
  const { currentUser, state, visibleActivities, companyById, toggleTheme, logoutUser } = useAgenda();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);

  const openIncidentsCount = (state.incidents || []).filter((i) => i.status === "abierto").length;
  const isAdmin = currentUser.role === "admin";

  // Escaneo automático de tareas vencidas y citas con la API de Notificaciones del navegador al montar
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const timer = setTimeout(() => {
        scanAndNotifyActivities({
          activities: visibleActivities,
          companyById,
          onSelectActivity,
          force: false,
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleActivities, companyById, onSelectActivity]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 md:flex transition-colors">
      {/* Barra lateral de escritorio */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#162035] dark:bg-[#0d131f] text-white md:flex shadow-2xl z-20 border-r border-slate-800/60">
        {/* Logotipo / Marca */}
        <div className="px-5 pb-4 pt-6">
          <div
            onClick={() => onNavigate("inicio")}
            className="flex cursor-pointer items-center gap-3 group"
          >
            <span className="flex size-9.5 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-lg font-black text-white shadow-md transition-transform group-hover:scale-105">
              N
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-white">Nuestra Agenda</p>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                {state.orgName || "Grupo Nuvia"}
              </p>
            </div>
          </div>
        </div>

        {/* AJUSTE SOLICITADO #3: Eliminado el botón "Nueva actividad" de la barra lateral izquierda */}

        {/* Navegación Principal */}
        <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3 scrollbar-thin">
          {MAIN_NAV.map((n) => {
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-white/15 dark:bg-indigo-600/30 text-white shadow-xs border border-white/10 dark:border-indigo-500/30 font-bold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                <span>{n.label}</span>
              </button>
            );
          })}

          <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Organización
          </p>

          {ORGANIZATION_NAV.map((n) => {
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-white/15 dark:bg-indigo-600/30 text-white shadow-xs border border-white/10 dark:border-indigo-500/30 font-bold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4" />
                  <span className="truncate">{n.label}</span>
                </div>
                {n.badge && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}

          <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ajustes & Servidor
          </p>

          {SYSTEM_NAV.map((n) => {
            if (n.adminOnly && !isAdmin) return null;
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-white/15 dark:bg-indigo-600/30 text-white shadow-xs border border-white/10 dark:border-indigo-500/30 font-bold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4" />
                  <span className="truncate">{n.label}</span>
                </div>
                {n.id === "soporte" && openIncidentsCount > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                    {openIncidentsCount}
                  </span>
                )}
                {n.badge && (
                  <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[9px] font-bold">
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botón de reporte de incidentes / Soporte */}
        <div className="px-3 pt-2">
          <button
            onClick={() => setSupportModalOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-2 text-xs font-bold text-rose-200 transition-colors hover:bg-rose-500/25"
          >
            <LifeBuoy className="size-3.5 text-rose-300" />
            Reportar incidente
          </button>
        </div>

        {/* Toggle de Modo Oscuro en Barra Lateral */}
        <div className="px-3 pt-2 flex items-center justify-between text-xs text-slate-300">
          <button
            onClick={toggleTheme}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 px-3 py-1.5 text-slate-300 text-xs font-medium"
            title="Alternar modo oscuro / claro"
          >
            <div className="flex items-center gap-2">
              {state.themeMode === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
              <span>{state.themeMode === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {state.themeMode === "dark" ? "Dark" : "Light"}
            </span>
          </button>
        </div>

        {/* Perfil del usuario activo & selector rápido */}
        <div className="p-3">
          <div className="flex items-center justify-between gap-1 rounded-xl bg-white/10 p-2.5">
            <button
              onClick={() => setUserSwitcherOpen(true)}
              className="flex cursor-pointer items-center gap-2.5 min-w-0 flex-1 text-left"
              title="Cambiar usuario o perfil de prueba"
            >
              <Avatar
                name={currentUser.name}
                initials={currentUser.initials}
                size="md"
                className="bg-white/20 text-white"
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-bold text-white">{currentUser.name}</p>
                <p className="truncate text-[10px] text-slate-300">
                  {currentUser.role === "admin" ? "Administradora" : "Miembro"}
                </p>
              </div>
              <ChevronDown className="size-3 text-slate-400 shrink-0" />
            </button>

            <button
              onClick={logoutUser}
              className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              title="Cerrar sesión"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior móvil */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between bg-[#162035] dark:bg-[#0d131f] px-4 text-white shadow-md md:hidden border-b border-slate-800">
          <div
            onClick={() => onNavigate("inicio")}
            className="flex cursor-pointer items-center gap-2"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-base font-black text-white">
              N
            </span>
            <span className="text-base font-extrabold tracking-tight text-white">Nuestra Agenda</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-300 hover:text-white"
              aria-label="Alternar modo oscuro"
            >
              {state.themeMode === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-300" />}
            </button>

            <NotificationCenter onSelectActivity={onSelectActivity} />

            <button
              onClick={() => onNavigate("perfil")}
              className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-white/30"
              aria-label="Mi Perfil"
            >
              <Avatar
                name={currentUser.name}
                initials={currentUser.initials}
                size="sm"
                className="bg-white/20 text-white"
              />
            </button>

            <button
              onClick={logoutUser}
              className="p-1.5 text-slate-300 hover:text-rose-400"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4 text-rose-400" />
            </button>
          </div>
        </header>

        {/* Barra superior en escritorio y tablet */}
        <div className="no-print border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#101726] px-4 py-2.5 sm:px-6 md:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Usuario activo: <strong className="text-slate-900 dark:text-white font-bold">{currentUser.name}</strong>{" "}
              ({currentUser.title || (currentUser.role === "admin" ? "Administradora" : "Miembro")})
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
              Espacio: <strong className="text-slate-800 dark:text-slate-200">{state.orgName || "Grupo Nuvia"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones nativas */}
            <div className="hidden sm:block">
              <NotificationCenter onSelectActivity={onSelectActivity} />
            </div>

            {/* Alternador de Modo Oscuro */}
            <button
              onClick={toggleTheme}
              className="cursor-pointer flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-bold"
              title="Cambiar tema de color"
            >
              {state.themeMode === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-600" />}
              <span className="hidden sm:inline">{state.themeMode === "dark" ? "Claro" : "Oscuro"}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate("admin")}
                className="cursor-pointer font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                🛠️ Panel Admin
              </button>
            )}

            <button
              onClick={() => onNavigate("perfil")}
              className="cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:underline"
            >
              ⚙️ Mi Perfil
            </button>

            <button
              onClick={() => setUserSwitcherOpen(true)}
              className="cursor-pointer font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              Cambiar usuario →
            </button>

            <button
              onClick={logoutUser}
              className="cursor-pointer flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline"
              title="Cerrar sesión actual"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        <main className="print-area mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 md:px-8 md:pb-12 md:pt-5">
          {/* Navegación tipo Breadcrumbs para jerarquía multi-empresa y proyectos */}
          <Breadcrumbs
            activeTab={activeTab}
            selectedCompanyId={selectedCompanyId}
            selectedActivityTitle={selectedActivityTitle}
            onNavigate={onNavigate}
            onSelectCompany={onSelectCompany}
          />
          {children}
        </main>

        {/* Navegación inferior fija en móviles */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#101726]/95 backdrop-blur-md md:hidden shadow-lg">
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-end">
            <BottomNavButton
              onClick={() => onNavigate("inicio")}
              active={activeTab === "inicio"}
              icon={Home}
              label="Inicio"
            />
            <BottomNavButton
              onClick={() => onNavigate("calendario")}
              active={activeTab === "calendario"}
              icon={CalendarDays}
              label="Calendario"
            />

            <div className="relative flex justify-center">
              <button
                type="button"
                onClick={() => onNavigate("crear")}
                aria-label="Crear actividad"
                className="fab-shadow absolute -top-6 flex size-13 cursor-pointer items-center justify-center rounded-full bg-[#162035] dark:bg-indigo-600 text-white ring-4 ring-white dark:ring-slate-900 transition-transform active:scale-95 hover:bg-[#243354]"
              >
                <Plus className="size-6 stroke-[3]" />
              </button>
              <span className="pb-1 text-[10px] font-semibold text-transparent select-none">Crear</span>
            </div>

            <BottomNavButton
              onClick={() => onNavigate("tareas")}
              active={activeTab === "tareas"}
              icon={CheckSquare}
              label="Tareas"
            />
            <BottomNavButton
              onClick={() => onNavigate("perfil")}
              active={activeTab === "perfil" || activeTab === "admin" || activeTab === "empresas"}
              icon={UserCheck}
              label="Perfil"
            />
          </div>
        </nav>
      </div>

      {/* Modales globales */}
      <SupportIncidentModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        currentPage={activeTab}
        onViewTickets={() => onNavigate("soporte")}
      />
      <UserSwitcherModal
        isOpen={userSwitcherOpen}
        onClose={() => setUserSwitcherOpen(false)}
      />
    </div>
  );
}

function BottomNavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full cursor-pointer flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
        active
          ? "text-[#162035] dark:text-indigo-400"
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
