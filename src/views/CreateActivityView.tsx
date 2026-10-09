import { ArrowLeft } from "lucide-react";
import { ActivityForm, type ActivityDraft } from "@/components/agenda/ActivityForm";
import { PageHeader } from "@/components/agenda/ui-bits";

export function CreateActivityView({
  initial,
  fromNoteId,
  onDone,
  onCancel,
}: {
  initial?: ActivityDraft;
  fromNoteId?: string;
  onDone: (createdId?: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <button
          onClick={onCancel}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="size-4" /> Volver
        </button>
      </div>

      <PageHeader
        title="Nueva actividad"
        subtitle="Elige el tipo de pendiente (Tarea, Reunión, Cita, Recordatorio, Vencimiento o Nota) y completa los datos."
      />

      <ActivityForm
        initial={initial}
        fromNoteId={fromNoteId}
        onDone={onDone}
      />
    </div>
  );
}
