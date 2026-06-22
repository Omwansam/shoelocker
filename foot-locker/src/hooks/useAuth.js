import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, isLoggedIn as readLoggedIn } from '../utils/auth.js';
import { logoutAndRedirect } from '../utils/authApi.js';

export function useAuth() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(readLoggedIn);

  useEffect(() => {
    function sync() {
      setLoggedIn(readLoggedIn());
    }
    globalThis.addEventListener('shoelocker-auth-changed', sync);
    return () => globalThis.removeEventListener('shoelocker-auth-changed', sync);
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    logoutAndRedirect(navigate);
  }, [navigate]);

  return {
    isLoggedIn: loggedIn,
    user: loggedIn ? getStoredUser() : null,
    logout,
  };
}
