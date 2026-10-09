/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente Breadcrumbs (Migas de pan) de navegación ejecutiva.
 * Facilita la orientación y navegación contextual entre la organización,
 * empresas, áreas, proyectos o actividades activas y las distintas vistas del sistema.
 */

import { ChevronRight, Home, Building2, CheckSquare, Calendar, StickyNote, Users, Settings, FolderTree, Sparkles } from "lucide-react";
import type { NavTab } from "./AppShell";
import { useAgenda } from "@/lib/agenda/store";
import { COMPANY_STYLES } from "./badges";

export interface BreadcrumbCustomItem {
  label: string;
  tab?: NavTab;
  companyId?: string | null;
  active?: boolean;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  activeTab: NavTab;
  selectedCompanyId?: string | null;
  selectedActivityTitle?: string | null;
  onNavigate: (tab: NavTab) => void;
  onSelectCompany?: (companyId: string | null) => void;
  customItems?: BreadcrumbCustomItem[];
}

const TAB_META: Record<NavTab, { label: string; icon: typeof Home; category?: string }> = {
  inicio: { label: "Panel Principal", icon: Home },
  calendario: { label: "Calendario", icon: Calendar, category: "Agenda" },
  tareas: { label: "Tareas y Proyectos", icon: CheckSquare, category: "Operaciones" },
  notas: { label: "Notas Rápidas", icon: StickyNote, category: "Espacio de Trabajo" },
  empresas: { label: "Empresas y Áreas", icon: Building2, category: "Organización" },
  equipo: { label: "Equipo y Permisos", icon: Users, category: "Organización" },
  imprimir: { label: "Imprimir / Exportar", icon: FolderTree, category: "Reportes" },
  integraciones: { label: "Avisos & Sincronización", icon: Settings, category: "Configuración" },
  soporte: { label: "Mesa de Soporte", icon: Settings, category: "Sistema" },
  perfil: { label: "Mi Perfil & Seguridad", icon: Settings, category: "Cuenta" },
  admin: { label: "Panel Administrador", icon: Settings, category: "Sistema" },
  crear: { label: "Nueva Actividad", icon: Sparkles, category: "Operaciones" },
};

export function Breadcrumbs({
  activeTab,
  selectedCompanyId,
  selectedActivityTitle,
  onNavigate,
  onSelectCompany,
  customItems,
}: BreadcrumbsProps) {
  const { state, companyById } = useAgenda();
  const currentCompany = selectedCompanyId ? companyById(selectedCompanyId) : null;
  const currentTabMeta = TAB_META[activeTab] || { label: "Sección", icon: Home };
  const TabIcon = currentTabMeta.icon;

  return (
    <nav
      aria-label="Migas de pan de navegación"
      className="no-print mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 select-none bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs backdrop-blur-xs"
    >
      {/* Raíz: Organización / Inicio */}
      <button
        onClick={() => {
          if (onSelectCompany) onSelectCompany(null);
          onNavigate("inicio");
        }}
        className="group flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        title={`Ir al inicio (${state.orgName || "Grupo Nuvia"})`}
      >
        <span className="flex size-5 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Home className="size-3" />
        </span>
        <span className="font-semibold tracking-tight">{state.orgName || "Grupo Nuvia"}</span>
      </button>

      {/* Si no estamos en inicio, renderizar separador */}
      {activeTab !== "inicio" && (
        <>
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />

          {/* Categoría o Empresa seleccionada en el árbol */}
          {currentCompany ? (
            <>
              <button
                onClick={() => {
                  onNavigate("empresas");
                }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ver todas las empresas"
              >
                <Building2 className="size-3 text-slate-400" />
                <span className="hidden sm:inline">Empresas</span>
              </button>

              <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />

              {/* Botón interactivo de la Empresa activa */}
              <button
                onClick={() => {
                  if (onSelectCompany) onSelectCompany(currentCompany.id);
                  onNavigate("tareas");
                }}
                className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  COMPANY_STYLES[currentCompany.color].soft
                } hover:opacity-85 shadow-2xs`}
                title={`Filtrado por: ${currentCompany.name} (${currentCompany.area})`}
              >
                <span className={`size-1.5 rounded-full ${COMPANY_STYLES[currentCompany.color].dot}`} />
                <span className="max-w-[150px] truncate">{currentCompany.name}</span>
                {currentCompany.area && (
                  <span className="text-[10px] opacity-75 hidden md:inline">· {currentCompany.area}</span>
                )}
              </button>

              {/* Si hay botón de quitar filtro de empresa */}
              {onSelectCompany && (
                <button
                  onClick={() => onSelectCompany(null)}
                  className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-0.5 cursor-pointer"
                  title="Quitar filtro de empresa y ver todo"
                >
                  (Todas)
                </button>
              )}
            </>
          ) : currentTabMeta.category ? (
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center gap-1">
              <span>{currentTabMeta.category}</span>
            </span>
          ) : null}

          {currentTabMeta.category && !currentCompany && (
            <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0 hidden sm:inline" />
          )}

          {/* Vista o Tab Activo */}
          <button
            onClick={() => onNavigate(activeTab)}
            className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
              !selectedActivityTitle
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <TabIcon className="size-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{currentTabMeta.label}</span>
          </button>
        </>
      )}

      {/* Si estamos en inicio pero hay empresa filtrada */}
      {activeTab === "inicio" && currentCompany && (
        <>
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span
            className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-lg border text-xs ${
              COMPANY_STYLES[currentCompany.color].soft
            }`}
          >
            <span className={`size-1.5 rounded-full ${COMPANY_STYLES[currentCompany.color].dot}`} />
            <span>{currentCompany.name}</span>
          </span>
        </>
      )}

      {/* Si hay una actividad o proyecto seleccionado (nivel más profundo) */}
      {selectedActivityTitle && (
        <>
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span
            className="font-semibold text-indigo-600 dark:text-indigo-400 max-w-[220px] truncate bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md"
            title={selectedActivityTitle}
          >
            {selectedActivityTitle}
          </span>
        </>
      )}

      {/* Ítems personalizados adicionales */}
      {customItems?.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer ${
                item.active ? "font-bold text-slate-900 dark:text-white" : ""
              }`}
            >
              {item.label}
            </button>
          ) : (
            <span className={item.active ? "font-bold text-slate-900 dark:text-white" : ""}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
