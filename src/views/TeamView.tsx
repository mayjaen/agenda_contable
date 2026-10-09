import { useState } from "react";
import { Check, Lock, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import type { Role, User } from "@/lib/agenda/types";
import { Avatar, COMPANY_STYLES } from "@/components/agenda/badges";
import { EmptyState, PageHeader, SectionTitle } from "@/components/agenda/ui-bits";

export function TeamView() {
  const { state, currentUser, visibleActivities, addMember, updateMember, deleteMember, changePassword } = useAgenda();
  const isAdmin = currentUser.role === "admin";

  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("miembro");
  const [password, setPassword] = useState("Password123*");
  const [searchQuery, setSearchQuery] = useState("");
  const [successNotice, setSuccessNotice] = useState(false);

  const openCreateModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setTitle("");
    setPhone("");
    setRole("miembro");
    setPassword("Password123*");
    setOpenModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setTitle(u.title || "");
    setPhone(u.phone || "");
    setRole(u.role);
    setPassword("");
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (editingUser) {
      updateMember(editingUser.id, {
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        phone: phone.trim(),
        role,
      });
      if (password.trim() && password !== "Password123*") {
        await changePassword(editingUser.id, "Password123*", password.trim());
      }
    } else {
      await addMember({
        name: name.trim(),
        email: email.trim(),
        role,
        title: title.trim(),
        phone: phone.trim(),
        password,
      });
    }

    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      setOpenModal(false);
      setName("");
      setEmail("");
      setTitle("");
      setPhone("");
      setEditingUser(null);
    }, 700);
  };

  const handleDelete = (id: string, userName: string) => {
    if (id === currentUser.id) {
      alert("No puedes eliminar al usuario con el que tienes la sesión activa.");
      return;
    }
    if (confirm(`¿Estás segura de eliminar al integrante "${userName}" del equipo?`)) {
      deleteMember(id);
    }
  };

  const filteredUsers = state.users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Equipo y Permisos"
        subtitle={`Administración escalable del equipo en ${state.orgName || "tu organización"}. Agrega integrantes ilimitados y configura sus roles.`}
        actions={
          <button
            onClick={openCreateModal}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#1b2640] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759]"
          >
            <UserPlus className="size-4" /> Agregar integrante
          </button>
        }
      />

      {/* Buscador de integrantes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o cargo…"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Mostrando {filteredUsers.length} de {state.users.length} integrantes
        </div>
      </div>

      {/* Lista de integrantes */}
      <section>
        <SectionTitle>Integrantes del Equipo</SectionTitle>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => {
            const companies = state.companies.filter((c) => c.memberIds.includes(u.id));
            const isMe = u.id === currentUser.id;
            const assignedCount = state.activities.filter(
              (a) => a.ownerId === u.id && a.status !== "completada",
            ).length;

            return (
              <div
                key={u.id}
                className={`card-elevated p-4.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 transition-all ${
                  isMe ? "ring-2 ring-[#1b2640] dark:ring-indigo-500 shadow-sm" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar name={u.name} initials={u.initials} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900 dark:text-white text-sm">
                        {u.name}{" "}
                        {isMe && <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">(tú)</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400 font-medium">{u.title || "Integrante"}</p>
                      <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(u)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar integrante"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                          title="Eliminar del equipo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      u.role === "admin"
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {u.role === "admin" && <ShieldCheck className="size-3" />}
                    {u.role === "admin" ? "Administradora" : "Miembro"}
                  </span>
                  {u.phone && <span className="text-[11px] text-slate-400 dark:text-slate-500">{u.phone}</span>}
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {companies.map((c) => (
                    <span
                      key={c.id}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        COMPANY_STYLES[c.color]?.soft || "bg-slate-100 dark:bg-slate-800"
                      } ${COMPANY_STYLES[c.color]?.text || "text-slate-700 dark:text-slate-300"}`}
                    >
                      {c.name}
                    </span>
                  ))}
                  {companies.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">Sin empresas asignadas</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{assignedCount} tareas pendientes</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Matriz de acceso interactiva */}
      <section>
        <SectionTitle>Matriz de Acceso por Empresa y Área</SectionTitle>
        <div className="card-elevated overflow-x-auto bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[540px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">Integrante</th>
                {state.companies.map((c) => (
                  <th key={c.id} className="p-3.5 text-center font-bold">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Avatar name={u.name} initials={u.initials} size="sm" />
                    <span>{u.name}</span>
                  </td>
                  {state.companies.map((c) => {
                    const hasAccess = c.memberIds.includes(u.id);
                    return (
                      <td key={c.id} className="p-3.5 text-center">
                        {hasAccess ? (
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full text-white ${
                              COMPANY_STYLES[c.color]?.bg || "bg-slate-500"
                            }`}
                          >
                            <Check className="size-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-bold">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal para agregar / editar integrante */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-elevated w-full max-w-md bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingUser ? "Editar integrante" : "Agregar nuevo integrante"}
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            {successNotice ? (
              <div className="py-8 text-center font-bold text-emerald-700 dark:text-emerald-400">
                ✓ ¡Integrante guardado con éxito!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ana Ríos"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#1b2640] dark:focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ana@empresa.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#1b2640] dark:focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Cargo o Puesto</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Contadora Jr."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#1b2640] dark:focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+507 6000-0000"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#1b2640] dark:focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Rol en la plataforma</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("miembro")}
                      className={`cursor-pointer rounded-xl border p-2 text-xs font-bold transition-colors ${
                        role === "miembro"
                          ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      Miembro
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`cursor-pointer rounded-xl border p-2 text-xs font-bold transition-colors ${
                        role === "admin"
                          ? "border-[#1b2640] bg-[#1b2640] dark:bg-indigo-600 dark:border-indigo-500 text-white"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      Administradora
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Contraseña temporal de acceso</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#1b2640] dark:focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    El usuario podrá cambiar su contraseña desde su perfil en cualquier momento.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-[#283759] dark:hover:bg-indigo-500"
                  >
                    {editingUser ? "Guardar cambios" : "Agregar al equipo"}
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
