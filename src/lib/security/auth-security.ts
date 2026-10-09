/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo de Seguridad y Sanitización para Nuestra Agenda.
 * Implementa defensas contra inyección SQL, XSS (Cross-Site Scripting),
 * hash criptográfico con Web Crypto API y protección contra fuerza bruta.
 */

/**
 * Sanitiza una cadena de texto para neutralizar ataques XSS y caracteres maliciosos.
 * Remueve etiquetas <script>, eventos JavaScript en línea (onclick, onerror) y secuencias peligrosas.
 * 
 * @param input Cadena a sanitizar
 * @returns Cadena limpia y segura
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    // Reemplaza entidades HTML críticas
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    // Elimina esquemas de URL peligrosos como javascript: o data:
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .trim();
}

/**
 * Valida y desinfecta cadenas de texto contra secuencias comunes de inyección SQL.
 * Protege contra patrones como ' OR '1'='1, UNION SELECT, --, DROP TABLE, etc.
 * 
 * @param input Cadena a validar
 * @returns true si la entrada es segura, false si contiene patrones de inyección
 */
export function validateAgainstSqlInjection(input: string): { isSafe: boolean; detectedPattern?: string } {
  if (!input) return { isSafe: true };

  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Comentarios y comillas
    /\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b/i, // Palabras clave SQL
    /(\bOR\b|\bAND\b)\s+[\d\w\'"]+\s*=\s*[\d\w\'"]/i, // Condicionales tautológicos tipo 1=1
    /\bSLEEP\s*\(\s*\d+\s*\)/i, // Time-based SQLi
    /\bBENCHMARK\s*\(/i,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return { isSafe: false, detectedPattern: pattern.source };
    }
  }

  return { isSafe: true };
}

/**
 * Valida un formato de correo electrónico corporativo seguro.
 * 
 * @param email Correo a validar
 * @returns true si cumple con el estándar RFC 5322 simplificado
 */
export function isValidSecureEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Evalúa la robustez de una contraseña.
 * Criterios: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.
 * 
 * @param password Contraseña a evaluar
 * @returns Nivel de seguridad (0 a 100) y lista de observaciones
 */
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 a 100
  label: "Muy Débil" | "Débil" | "Aceptable" | "Fuerte" | "Excelente";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: "Muy Débil", feedback: ["La contraseña no puede estar vacía."] };
  }

  if (password.length >= 8) score += 25;
  else feedback.push("Debe tener al menos 8 caracteres.");

  if (password.length >= 12) score += 15;

  if (/[A-Z]/.test(password)) score += 20;
  else feedback.push("Incluye al menos una letra mayúscula (A-Z).");

  if (/[a-z]/.test(password)) score += 15;
  else feedback.push("Incluye al menos una letra minúscula (a-z).");

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push("Incluye al menos un número (0-9).");

  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  else feedback.push("Incluye al menos un símbolo especial (!@#$%^&*...).");

  let label: "Muy Débil" | "Débil" | "Aceptable" | "Fuerte" | "Excelente" = "Muy Débil";
  if (score >= 85) label = "Excelente";
  else if (score >= 70) label = "Fuerte";
  else if (score >= 50) label = "Aceptable";
  else if (score >= 30) label = "Débil";

  return { score: Math.min(score, 100), label, feedback };
}

/**
 * Genera un hash criptográfico SHA-256 de una contraseña utilizando la API nativa Web Crypto.
 * Nunca almacena contraseñas en texto plano.
 * 
 * @param plainText Contraseña en texto plano
 * @param salt Cadena salt para prevenir ataques de diccionario / rainbow tables
 * @returns Hash hexadecimal SHA-256
 */
export async function hashPassword(plainText: string, salt: string = "NuestraAgenda_SecureSalt_2026"): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gestor de Fuerza Bruta en Memoria / LocalStorage.
 * Bloquea intentos de inicio de sesión sospechosos tras múltiples fallos consecutivos.
 */
const RATE_LIMIT_KEY = "nuestra_agenda_rate_limit";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

export interface RateLimitState {
  attempts: number;
  lockedUntil: number | null; // Timestamp
}

export function getRateLimitState(identifier: string): RateLimitState {
  if (typeof window === "undefined") return { attempts: 0, lockedUntil: null };
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_KEY}_${identifier}`);
    if (raw) {
      const state: RateLimitState = JSON.parse(raw);
      if (state.lockedUntil && Date.now() > state.lockedUntil) {
        // Bloqueo expirado: reiniciar
        clearRateLimit(identifier);
        return { attempts: 0, lockedUntil: null };
      }
      return state;
    }
  } catch (err) {
    console.warn("Error leyendo limitador de intentos:", err);
  }
  return { attempts: 0, lockedUntil: null };
}

export function recordFailedAttempt(identifier: string): { isLocked: boolean; remainingMinutes: number } {
  const current = getRateLimitState(identifier);
  const newAttempts = current.attempts + 1;
  let lockedUntil = current.lockedUntil;

  if (newAttempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
  }

  const newState: RateLimitState = { attempts: newAttempts, lockedUntil };
  if (typeof window !== "undefined") {
    localStorage.setItem(`${RATE_LIMIT_KEY}_${identifier}`, JSON.stringify(newState));
  }

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const remainingMinutes = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / (60 * 1000)) : 0;

  return { isLocked, remainingMinutes };
}

export function clearRateLimit(identifier: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`${RATE_LIMIT_KEY}_${identifier}`);
  }
}
