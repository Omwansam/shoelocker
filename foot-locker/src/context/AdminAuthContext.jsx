import { useCallback, useMemo, useState } from 'react';
import { AdminAuthContext } from './adminAuthContext.js';
import { loginRequest, clearAuthStorage } from '../utils/authApi.js';

/**
 * @typedef {{
 *   email: string,
 *   signedInAt: number,
 * }} AdminSession
 */

/** @typedef {{
 *   session: AdminSession | null,
 *   login: (email: string, password: string) => Promise<{ ok: boolean, error?: string }>,
 *   logout: () => void,
 * }} AdminAuthValue */

/** @param {{ children: import('react').ReactNode }} props */
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(/** @type {AdminSession | null} */ (() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = String(user?.role || '').toLowerCase();
        const isAdmin = Boolean(user?.is_admin) || role === 'admin' || role === 'manager';
        if (isAdmin) {
          return {
            email: user.email || 'admin@shoelocker.ke',
            signedInAt: Date.now(),
          };
        }
      } catch (e) {
        console.error('Failed to restore admin session:', e);
      }
    }
    return null;
  }));

  const login = useCallback(async (email, password) => {
    try {
      const payload = await loginRequest(email.trim(), password);
      const user = payload?.user;
      const role = String(user?.role || '').toLowerCase();
      const isAdmin = Boolean(user?.is_admin) || role === 'admin' || role === 'manager';
      if (!isAdmin) {
        return { ok: false, error: 'This account is not allowed in admin console.' };
      }
      const next = {
        email: user?.email || email.trim() || 'admin@shoelocker.ke',
        signedInAt: Date.now(),
      };
      setSession(next);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
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
