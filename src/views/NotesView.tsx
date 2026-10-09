import { useMemo, useState } from "react";
import { ArrowRightCircle, CheckCircle2, Plus, Search, StickyNote, Trash2, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { fmtMedium, capitalize } from "@/lib/agenda/dates";
import { COMPANY_STYLES, CompanyBadge } from "@/components/agenda/badges";
import { Chip, EmptyState, PageHeader } from "@/components/agenda/ui-bits";

export function NotesView({
  onConvertToTask,
  onOpenTask,
}: {
  onConvertToTask: (note: { id: string; title: string; content: string; companyId: string | null }) => void;
  onOpenTask: (activityId: string) => void;
}) {
  const { visibleNotes, state, currentUser, companyById, userById, addNote, deleteNote } = useAgenda();
  const [q, setQ] = useState("");
  const [company, setCompany] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newCompany, setNewCompany] = useState<string>("personal");
  const [savedAlert, setSavedAlert] = useState(false);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return visibleNotes
      .filter((n) => (company ? (company === "personal" ? !n.companyId : n.companyId === company) : true))
      .filter((n) => (ql ? (n.title + " " + n.content).toLowerCase().includes(ql) : true));
  }, [visibleNotes, q, company]);

  const save = () => {
    if (!title.trim()) return;
    addNote({
      title: title.trim(),
      content: content.trim(),
      companyId: newCompany === "personal" ? null : newCompany,
      authorId: currentUser.id,
    });
    setTitle("");
    setContent("");
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Notas rápidas"
        subtitle="Apunta ideas al vuelo, notas de reuniones o pendientes y conviértelas en tareas cuando haga falta."
      />

      {/* Creador de notas */}
      <div className="card-elevated mb-6 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-4 shadow-sm sm:p-5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la nota o recordatorio…"
          className="w-full text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe detalles, teléfonos, listas o notas aquí…"
          rows={2}
          className="mt-2 w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">Área:</span>
            <Chip active={newCompany === "personal"} onClick={() => setNewCompany("personal")}>
              Personal
            </Chip>
            {state.companies.map((c) => (
              <Chip key={c.id} active={newCompany === c.id} onClick={() => setNewCompany(c.id)}>
                <span className={`size-2 rounded-full ${COMPANY_STYLES[c.color].dot}`} />
                {c.name}
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {savedAlert && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Nota guardada</span>
            )}
            <button
              onClick={save}
              disabled={!title.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="size-4 stroke-[3]" /> Guardar nota
            </button>
          </div>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en notas…"
          className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden shadow-xs"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={!company} onClick={() => setCompany(null)}>
          Todas las notas
        </Chip>
        <Chip active={company === "personal"} onClick={() => setCompany("personal")}>
          Personal
        </Chip>
        {state.companies.map((c) => (
          <Chip key={c.id} active={company === c.id} onClick={() => setCompany(c.id)}>
            <span className={`size-2 rounded-full ${COMPANY_STYLES[c.color].dot}`} />
            {c.name}
          </Chip>
        ))}
      </div>

      {/* Grilla de notas */}
      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {list.length ? (
          list.map((n) => {
            const c = companyById(n.companyId);
            const author = userById(n.authorId);
            return (
              <article
                key={n.id}
                className={`card-elevated flex flex-col p-4.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md ${
                  COMPANY_STYLES[c?.color ?? "personal"].soft
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white leading-snug">{n.title}</h3>
                  <button
                    onClick={() => deleteNote(n.id)}
                    aria-label="Eliminar nota"
                    className="cursor-pointer shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {n.content && (
                  <p className="mt-2 flex-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {n.content}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/50 dark:border-slate-800 pt-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <CompanyBadge company={c} className="bg-white/90 dark:bg-slate-800/90" />
                    <span>
                      {author?.name} · {capitalize(fmtMedium(new Date(n.createdAt)))}
                    </span>
                  </div>

                  {n.convertedActivityId ? (
                    <button
                      onClick={() => onOpenTask(n.convertedActivityId!)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <CheckCircle2 className="size-3.5" /> Ver tarea
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        onConvertToTask({
                          id: n.id,
                          title: n.title,
                          content: n.content,
                          companyId: n.companyId,
                        })
                      }
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      <ArrowRightCircle className="size-3.5" /> Convertir en tarea
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            className="sm:col-span-2 lg:col-span-3"
            icon={StickyNote}
            title="Sin notas encontradas"
            description="Escribe una nota rápida arriba. Puedes asociarla a una empresa o dejarla como personal."
          />
        )}
      </div>
    </div>
  );
}
