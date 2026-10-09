import { useState } from "react";
import { Check, KeyRound, Lock, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import { Avatar } from "@/components/agenda/badges";
import { PageHeader } from "@/components/agenda/ui-bits";

export function ProfileView() {
  const { currentUser, state, updateUserProfile, changePassword } = useAgenda();

  // Datos personales
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [title, setTitle] = useState(currentUser.title || "");
  const [primaryCompany, setPrimaryCompany] = useState(currentUser.primaryCompanyId || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Cambio de contraseña
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile(currentUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      primaryCompanyId: primaryCompany || undefined,
    });

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPass) {
      setPassError("Por favor ingresa tu contraseña actual.");
      return;
    }
    if (newPass.length < 6) {
      setPassError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Las contraseñas nuevas no coinciden.");
      return;
    }

    const res = await changePassword(currentUser.id, currentPass, newPass);
    if (!res.success) {
      setPassError(res.message);
    } else {
      setPassSuccess(res.message);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => setPassSuccess(null), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Mi Perfil y Seguridad"
        subtitle="Administra tu información personal, cargo dentro del equipo y credenciales de acceso."
      />

      {/* Resumen del perfil en tarjeta */}
      <div className="card-elevated flex flex-col gap-4 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={currentUser.name}
            initials={currentUser.initials}
            size="lg"
            className="size-16 text-lg ring-4 ring-slate-100 dark:ring-slate-800"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{currentUser.name}</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  currentUser.role === "admin"
                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {currentUser.role === "admin" && <ShieldCheck className="size-3.5" />}
                {currentUser.role === "admin" ? "Administradora" : "Miembro del Equipo"}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{currentUser.title || "Sin cargo especificado"}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-600 dark:text-slate-400 sm:text-right">
          <p>Organización activa:</p>
          <p className="font-extrabold text-slate-900 dark:text-white">{state.orgName || "Grupo Nuvia"}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulario 1: Datos Personales */}
        <div className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="size-5 text-[#1b2640] dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Información Personal</h3>
          </div>

          {profileSaved && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="size-4" /> Datos personales actualizados correctamente.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Cargo o Puesto en la empresa</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Contadora, Directora, Asesor Inmobiliario…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono / WhatsApp de contacto</label>
              <div className="relative">
                <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+507 6000-0000"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Empresa principal asignada</label>
              <select
                value={primaryCompany}
                onChange={(e) => setPrimaryCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden bg-white dark:bg-slate-900"
              >
                <option value="">Ninguna / Todas</option>
                {state.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                Guardar información
              </button>
            </div>
          </form>
        </div>

        {/* Formulario 2: Cambio de Contraseña y Seguridad */}
        <div className="card-elevated bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <KeyRound className="size-5 text-[#1b2640] dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Seguridad & Cambio de Contraseña</h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Actualiza tu contraseña periódicamente para proteger la información confidencial de las empresas y clientes.
          </p>

          {passError && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-3 text-xs font-bold text-rose-800 dark:text-rose-300">
              ⚠️ {passError}
            </div>
          )}

          {passSuccess && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="size-4" /> {passSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Contraseña actual</label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Nueva contraseña</label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Confirmar nueva contraseña</label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#1b2640] dark:focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-700 dark:text-slate-300">Recomendaciones de seguridad:</p>
              <p>• Usa al menos 6 caracteres combinando letras mayúsculas, minúsculas y números.</p>
              <p>• No compartas tus claves de acceso con terceros ni por chats públicos.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-[#1b2640] dark:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#283759] dark:hover:bg-indigo-500"
              >
                Actualizar contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
