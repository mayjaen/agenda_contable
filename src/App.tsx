/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AgendaProvider, useAgenda } from "@/lib/agenda/store";
import { AppShell, type NavTab } from "@/components/agenda/AppShell";
import { DashboardView } from "@/views/DashboardView";
import { CalendarView } from "@/views/CalendarView";
import { TasksView } from "@/views/TasksView";
import { NotesView } from "@/views/NotesView";
import { CompaniesView } from "@/views/CompaniesView";
import { TeamView } from "@/views/TeamView";
import { PrintView } from "@/views/PrintView";
import { ProfileView } from "@/views/ProfileView";
import { IntegrationsView } from "@/views/IntegrationsView";
import { SupportTicketsView } from "@/views/SupportTicketsView";
import { CreateActivityView } from "@/views/CreateActivityView";
import { AdminPanelView } from "@/views/AdminPanelView";
import { LoginView } from "@/views/LoginView";
import { TaskDetailModal } from "@/components/agenda/TaskDetailModal";
import type { ActivityDraft } from "@/components/agenda/ActivityForm";

export default function App() {
  return (
    <AgendaProvider>
      <MainAgendaApp />
    </AgendaProvider>
  );
}

function MainAgendaApp() {
  const { state } = useAgenda();
  const [activeTab, setActiveTab] = useState<NavTab>("inicio");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<ActivityDraft | undefined>(undefined);
  const [fromNoteId, setFromNoteId] = useState<string | undefined>(undefined);
  const [tasksCompanyFilter, setTasksCompanyFilter] = useState<string | null>(null);

  // Si no está autenticado, renderizar el portal de Login Seguro
  if (!state.isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenActivity = (id: string) => {
    setSelectedActivityId(id);
  };

  const handleCreateNew = (draft?: ActivityDraft, noteId?: string) => {
    setCreateDraft(draft);
    setFromNoteId(noteId);
    setActiveTab("crear");
  };

  const handleCreateForDate = (dateKey: string) => {
    handleCreateNew({ date: dateKey });
  };

  const handleConvertToTask = (note: { id: string; title: string; content: string; companyId: string | null }) => {
    handleCreateNew(
      {
        type: "tarea",
        title: note.title,
        description: note.content,
        companyId: note.companyId || "personal",
        visibility: note.companyId ? "empresa" : "privada",
      },
      note.id,
    );
  };

  const handleFilterCompanyTasks = (companyId: string) => {
    setTasksCompanyFilter(companyId);
    setActiveTab("tareas");
  };

  const selectedActivity = selectedActivityId
    ? state.activities.find((a) => a.id === selectedActivityId)
    : null;

  return (
    <AppShell
      activeTab={activeTab}
      selectedCompanyId={tasksCompanyFilter}
      selectedActivityTitle={selectedActivity?.title}
      onSelectCompany={(companyId) => {
        setTasksCompanyFilter(companyId);
      }}
      onNavigate={(tab) => {
        if (tab === "crear") {
          setCreateDraft(undefined);
          setFromNoteId(undefined);
        }
        setActiveTab(tab);
      }}
      onSelectActivity={handleOpenActivity}
    >
      {activeTab === "inicio" && (
        <DashboardView
          onSelectActivity={handleOpenActivity}
          onNavigate={(tab) => {
            if (tab === "crear") {
              handleCreateNew();
            } else {
              setActiveTab(tab);
            }
          }}
          onFilterCompany={handleFilterCompanyTasks}
          onConvertToTask={(reminder) =>
            handleCreateNew({
              title: reminder.title,
              companyId: reminder.companyId ?? undefined,
              type: "tarea",
            })
          }
        />
      )}

      {activeTab === "calendario" && (
        <CalendarView
          onSelectActivity={handleOpenActivity}
          onCreateForDate={handleCreateForDate}
        />
      )}

      {activeTab === "tareas" && (
        <TasksView
          key={tasksCompanyFilter ?? "all"}
          initialCompanyId={tasksCompanyFilter}
          onSelectActivity={handleOpenActivity}
          onNavigate={(tab) => handleCreateNew()}
          onCompanyChange={(cId) => setTasksCompanyFilter(cId)}
        />
      )}

      {activeTab === "notas" && (
        <NotesView
          onConvertToTask={handleConvertToTask}
          onOpenTask={handleOpenActivity}
        />
      )}

      {activeTab === "empresas" && (
        <CompaniesView onFilterCompanyTasks={handleFilterCompanyTasks} />
      )}

      {activeTab === "equipo" && <TeamView />}

      {activeTab === "imprimir" && <PrintView />}

      {activeTab === "integraciones" && <IntegrationsView />}

      {activeTab === "soporte" && (
        <SupportTicketsView onOpenReportModal={() => {}} />
      )}

      {activeTab === "perfil" && <ProfileView />}

      {activeTab === "admin" && <AdminPanelView />}

      {activeTab === "crear" && (
        <CreateActivityView
          initial={createDraft}
          fromNoteId={fromNoteId}
          onDone={(createdId) => {
            if (createdId) {
              setSelectedActivityId(createdId);
            }
            setActiveTab("tareas");
          }}
          onCancel={() => setActiveTab("inicio")}
        />
      )}

      {/* Modal global de detalle de actividad */}
      <TaskDetailModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </AppShell>
  );
}
