import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuthContext } from './adminAuthContext.js';
import { isAdminUser, logoutAndRedirect } from '../utils/authApi.js';

function readAdminSessionFromStorage() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr);
    if (!isAdminUser(user)) return null;
    return {
      email: user.email || 'admin@shoelocker.ke',
      signedInAt: Date.now(),
    };
  } catch (e) {
    console.error('Failed to restore admin session:', e);
    return null;
  }
}

/**
 * @typedef {{
 *   email: string,
 *   signedInAt: number,
 * }} AdminSession
 */

/** @typedef {{
 *   session: AdminSession | null,
 *   logout: () => void,
 * }} AdminAuthValue */

/** @param {{ children: import('react').ReactNode }} props */
export function AdminAuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(/** @type {AdminSession | null} */ (readAdminSessionFromStorage));

  useEffect(() => {
    function syncSession() {
      setSession(readAdminSessionFromStorage());
    }
    globalThis.addEventListener('shoelocker-auth-changed', syncSession);
    return () => globalThis.removeEventListener('shoelocker-auth-changed', syncSession);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    logoutAndRedirect(navigate);
  }, [navigate]);


  const value = useMemo(
    () =>
      /** @type {AdminAuthValue} */ ({
        session,
        logout,
      }),
    [session, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
