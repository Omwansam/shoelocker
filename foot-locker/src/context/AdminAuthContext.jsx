import { useCallback, useMemo, useState } from 'react';
import {
  ADMIN_SESSION_STORAGE_KEY,
  getAdminDemoPassword,
} from '../config/admin.js';
import { AdminAuthContext } from './adminAuthContext.js';

/**
 * @typedef {{
 *   email: string,
 *   signedInAt: number,
 * }} AdminSession
 */

/** @typedef {{
 *   session: AdminSession | null,
 *   login: (email: string, password: string) => boolean,
 *   logout: () => void,
 * }} AdminAuthValue */

/** @returns {AdminSession | null} */
function readSession() {
  try {
    const raw = globalThis.localStorage?.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (
      o &&
      typeof o.email === 'string' &&
      typeof o.signedInAt === 'number'
    ) {
      return { email: o.email, signedInAt: o.signedInAt };
    }
    return null;
  } catch {
    return null;
  }
}

/** @param {AdminSession | null} s */
function persistSession(s) {
  if (!globalThis.localStorage) return;
  if (!s) globalThis.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  else globalThis.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(s));
}

/** @param {{ children: import('react').ReactNode }} props */
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = useCallback((email, password) => {
    const ok = password === getAdminDemoPassword();
    if (!ok) return false;
    const next = {
      email: email.trim() || 'admin@shoelocker.ke',
      signedInAt: Date.now(),
    };
    persistSession(next);
    setSession(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () =>
      /** @type {AdminAuthValue} */ ({
        session,
        login,
        logout,
      }),
    [session, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
