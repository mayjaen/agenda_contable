import { useState } from "react";
import { Check, Plus, Shield, User, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { Avatar } from "./badges";

export function UserSwitcherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { state, currentUser, setCurrentUserId, addOrganization, setCurrentOrg, resetToDemo } = useAgenda();
  const [newOrgName, setNewOrgName] = useState("");
  const [showOrgForm, setShowOrgForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const newId = await addOrganization(newOrgName.trim());
    setCurrentOrg(newId);
    setNewOrgName("");
    setShowOrgForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="card-elevated w-full max-w-md bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cambiar usuario / Espacio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Prueba cómo ve la agenda cada integrante del equipo</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Integrantes del equipo ({state.orgName || "Organización activa"})
            </label>
            <div className="space-y-1.5">
              {state.users.map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUserId(u.id);
                      onClose();
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-[#1b2640] dark:border-indigo-500 bg-[#1b2640]/5 dark:bg-indigo-950/40 font-semibold text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} initials={u.initials} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</p>
                          {u.role === "admin" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                              <Shield className="size-2.5" /> Administradora
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="size-4 text-[#1b2640] dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de organización */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Espacio de trabajo</span>
              <button
                type="button"
                onClick={() => setShowOrgForm(!showOrgForm)}
                className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Crear espacio
              </button>
            </div>

            {showOrgForm && (
              <form onSubmit={handleCreateOrg} className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Nombre de la nueva empresa/grupo…"
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
                >
                  Crear
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {(state.organizations || [{ id: "grupo-nuvia", name: "Grupo Nuvia" }]).map((org) => (
                <button
                  key={org.id}
                  onClick={() => setCurrentOrg(org.id)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    state.orgId === org.id
                      ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <button
              onClick={() => {
                if (confirm("¿Restaurar todos los datos iniciales de la agenda?")) {
                  resetToDemo();
                  onClose();
                }
              }}
              className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 underline"
            >
              Reiniciar datos de prueba
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
