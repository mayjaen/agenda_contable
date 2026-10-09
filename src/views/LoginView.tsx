/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Front de Inicio de Sesión Seguro (LoginView).
 * Incorpora defensas activas contra inyección SQL, ataques XSS,
 * protección contra fuerza bruta con bloqueo temporal y medidor de robustez de contraseña.
 */

import { useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Shield,
  ShieldCheck,
  Sun,
  UserCheck,
} from "lucide-react";
import { useAgenda } from "@/lib/agenda/store";
import {
  evaluatePasswordStrength,
  getRateLimitState,
  isValidSecureEmail,
  sanitizeInput,
  validateAgainstSqlInjection,
} from "@/lib/security/auth-security";

export function LoginView() {
  const { loginUser, state, toggleTheme } = useAgenda();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si la IP/email está bloqueada por fuerza bruta
  const rateLimit = getRateLimitState(email.toLowerCase().trim());
  const isLocked = rateLimit.lockedUntil !== null && Date.now() < rateLimit.lockedUntil;
  const remainingMinutes = rateLimit.lockedUntil
    ? Math.ceil((rateLimit.lockedUntil - Date.now()) / (60 * 1000))
    : 0;

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Detección proactiva de inyección SQL
    const emailSql = validateAgainstSqlInjection(email);
    const passSql = validateAgainstSqlInjection(password);
    if (!emailSql.isSafe || !passSql.isSafe) {
      setErrorMessage("⚠️ Patrón malicioso o caracteres no permitidos detectados. Solicitud bloqueada.");
      return;
    }

    // 2. Validación de formato de correo
    const sanitizedEmail = sanitizeInput(email);
    if (!isValidSecureEmail(sanitizedEmail)) {
      setErrorMessage("Por favor ingresa un correo electrónico válido y seguro.");
      return;
    }

    if (!password) {
      setErrorMessage("Por favor ingresa tu contraseña de acceso.");
      return;
    }

    setIsLoading(true);
    const result = await loginUser(sanitizedEmail, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleQuickDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123*");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-[#090d16] transition-colors relative overflow-hidden">
      {/* Elementos visuales de fondo premium */}
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Botón de Modo Oscuro en cabecera */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="flex size-10 cursor-pointer items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={state.themeMode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label="Alternar modo oscuro"
        >
          {state.themeMode === "dark" ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5 text-indigo-600" />}
        </button>
      </div>

      <div className="card-elevated w-full max-w-md bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-7 sm:p-8 shadow-2xl relative z-10">
        {/* Cabecera / Identidad */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#162035] dark:bg-indigo-600 text-white shadow-md mb-3">
            <CalendarCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Nuestra Agenda
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Acceso Corporativo Seguro — {state.orgName || "Grupo Nuvia"}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Conexión cifrada TLS 1.3 & Protección Anti-Inyección</span>
          </div>
        </div>

        {/* Alerta de bloqueo por fuerza bruta */}
        {isLocked && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/50 p-3.5 text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="size-4 shrink-0 text-rose-600" />
              <span>Acceso bloqueado por seguridad</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed">
              Se detectaron 5 intentos fallidos consecutivos. Por favor espera{" "}
              <strong>{remainingMinutes} minutos</strong> antes de reintentar.
            </p>
          </div>
        )}

        {/* Mensaje de error general */}
        {errorMessage && !isLocked && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="size-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={isLocked}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer">
                ¿Olvidaste tu contraseña?
              </span>
            </div>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                disabled={isLocked}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden disabled:opacity-50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Medidor visual de robustez si está escribiendo */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">Robustez:</span>
                  <span
                    className={`font-bold ${
                      strength.score >= 70
                        ? "text-emerald-600 dark:text-emerald-400"
                        : strength.score >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 70 ? "bg-emerald-500" : strength.score >= 40 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLocked || isLoading}
            className="w-full cursor-pointer rounded-xl bg-[#162035] dark:bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-[#243354] dark:hover:bg-indigo-700 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verificando credenciales..." : "Iniciar Sesión Segura"}
          </button>
        </form>

        {/* Acceso Rápido de Prueba (QA / Demo sin contraseñas quemadas expuestas) */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="mb-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Accesos de prueba de desarrollo / QA:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoSelect("nuviamitre30@gmail.com")}
              className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Nuvia (Admin)</p>
              <p className="text-[10px] text-slate-400 truncate">nuviamitre30@gmail.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoSelect("liz@nuestraagenda.app")}
              className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Liz (Contabilidad)</p>
              <p className="text-[10px] text-slate-400 truncate">liz@nuestraagenda.app</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoSelect("vivian@nuestraagenda.app")}
              className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Vivian (Finanzas)</p>
              <p className="text-[10px] text-slate-400 truncate">vivian@nuestraagenda.app</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoSelect("michelle@nuestraagenda.app")}
              className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Michelle (Legal)</p>
              <p className="text-[10px] text-slate-400 truncate">michelle@nuestraagenda.app</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
