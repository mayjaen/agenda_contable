import { useState } from "react";
import { ArrowRight, Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { daysUntil, nextOccurrence } from "@/lib/agenda/dates";
import type { Company, CompanyColor } from "@/lib/agenda/types";
import { Avatar, COMPANY_STYLES } from "@/components/agenda/badges";
import { PageHeader } from "@/components/agenda/ui-bits";

const COLOR_OPTIONS: { value: CompanyColor; label: string; dot: string }[] = [
  { value: "solidez", label: "Verde azulado (Solidez)", dot: "bg-teal-600" },
  { value: "mr", label: "Ámbar (M&R)", dot: "bg-amber-500" },
  { value: "ramac", label: "Terracota (RAMAC)", dot: "bg-orange-600" },
  { value: "plp", label: "Índigo (PLP)", dot: "bg-indigo-600" },
  { value: "personal", label: "Gris", dot: "bg-slate-500" },
];

export function CompaniesView({
  onFilterCompanyTasks,
}: {
  onFilterCompanyTasks: (companyId: string) => void;
}) {
  const { state, visibleActivities, userById, currentUser, addCompany, updateCompany, deleteCompany } =
    useAgenda();
  const isAdmin = currentUser.role === "admin";

  const [openModal, setOpenModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [ruc, setRuc] = useState("");
  const [color, setColor] = useState<CompanyColor>("solidez");
  const [memberIds, setMemberIds] = useState<string[]>([currentUser.id]);
  const [successNotice, setSuccessNotice] = useState(false);

  const openCreateModal = () => {
    setEditingCompany(null);
    setName("");
    setArea("");
    setDescription("");
    setRuc("");
    setColor("solidez");
    setMemberIds([currentUser.id]);
    setOpenModal(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setArea(comp.area);
    setDescription(comp.description || "");
    setRuc(comp.ruc || "");
    setColor(comp.color);
    setMemberIds(comp.memberIds);
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCompany) {
      updateCompany(editingCompany.id, {
        name: name.trim(),
        area: area.trim(),
        color,
        memberIds,
        description: description.trim(),
        ruc: ruc.trim(),
      });
    } else {
      await addCompany({
        name: name.trim(),
        area: area.trim(),
        color,
        memberIds,
        description: description.trim(),
        ruc: ruc.trim(),
      });
    }

    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      setOpenModal(false);
      setName("");
      setArea("");
      setDescription("");
      setRuc("");
      setEditingCompany(null);
    }, 700);
  };

  const handleDelete = (id: string, compName: string) => {
    if (confirm(`¿Estás segura de eliminar la empresa "${compName}"? Las actividades asociadas pasarán a la categoría personal.`)) {
      deleteCompany(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Empresas y Áreas del Grupo"
        subtitle="Administra y escala las empresas del grupo corporativo, asigna integrantes y da seguimiento a los pendientes de cada línea de negocio."
        actions={
          isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759]"
            >
              <Plus className="size-4 stroke-[3]" /> Nueva empresa / área
            </button>
          )
        }
      />

      {/* Grilla de empresas escalables */}
      <div className="grid gap-5 md:grid-cols-2">
        {state.companies.map((c) => {
          const s = COMPANY_STYLES[c.color] || COMPANY_STYLES.personal;
          const items = visibleActivities.filter((a) => a.companyId === c.id);
          const open = items.filter((a) => a.status !== "completada");
          const done = items.length - open.length;
          const late = open.filter((a) => daysUntil(nextOccurrence(a)) < 0).length;
          const soon = open.filter((a) => {
            const n = daysUntil(nextOccurrence(a));
            return n >= 0 && n <= 3;
          }).length;
          const member = c.memberIds.includes(currentUser.id);
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;

          return (
            <div key={c.id} className="card-elevated overflow-hidden bg-white dark:bg-[#101726] shadow-sm transition-all hover:shadow-md">
              <div className={`flex items-center justify-between p-5 ${s.soft}`}>
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`flex size-12 items-center justify-center rounded-2xl text-white font-bold shadow-xs ${s.bg}`}>
                    <Building2 className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{c.name}</h2>
                    <p className={`text-xs font-bold ${s.text}`}>{c.area || "Área operativa"}</p>
                    {c.ruc && <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">RUC: {c.ruc}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {member && (
                    <span className="rounded-full bg-white dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">
                      Soy parte
                    </span>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(c)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-2xs"
                        title="Editar datos de empresa"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 shadow-2xs"
                        title="Eliminar empresa"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                {c.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{c.description}"
                  </p>
                )}

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Equipo con acceso ({c.memberIds.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.memberIds.map((id) => {
                      const u = userById(id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-1 pl-1 pr-3 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          <Avatar name={u.name} initials={u.initials} size="sm" />
                          {u.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-700/60">
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{open.length}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendientes</p>
                  </div>
                  <div className={`rounded-xl p-2.5 border ${soon ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300" : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60"}`}>
                    <p className={`text-xl font-extrabold ${soon ? "text-amber-800 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>{soon}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Por vencer</p>
                  </div>
                  <div className={`rounded-xl p-2.5 border ${late ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300" : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60"}`}>
                    <p className={`text-xl font-extrabold ${late ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-white"}`}>{late}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atrasadas</p>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Avance de tareas</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {done} de {items.length} completadas ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${s.bg}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => onFilterCompanyTasks(c.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:underline"
                  >
                    Ver todas las tareas de {c.name} <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Crear / Editar Empresa */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-elevated w-full max-w-md bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCompany ? "Editar empresa o área" : "Nueva empresa o área"}
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            {successNotice ? (
              <div className="py-8 text-center font-bold text-emerald-600 dark:text-emerald-400">
                ✓ ¡Empresa guardada exitosamente!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre de la empresa</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Inversiones del Pacífico"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Área o giro</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Ej. Finanzas, Legal…"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">RUC / Registro fiscal</label>
                    <input
                      type="text"
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value)}
                      placeholder="Ej. 155000-1-2024"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Descripción o alcance</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve reseña del objetivo de la empresa…"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Color distintivo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setColor(o.value)}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition-colors ${
                          color === o.value
                            ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span className={`size-3 rounded-full ${o.dot}`} />
                        <span className="truncate">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Integrantes con acceso</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {state.users.map((u) => {
                      const on = memberIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() =>
                            setMemberIds((m) =>
                              on ? m.filter((x) => x !== u.id) : [...m, u.id],
                            )
                          }
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${
                            on
                              ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
                  >
                    {editingCompany ? "Guardar cambios" : "Crear empresa"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
