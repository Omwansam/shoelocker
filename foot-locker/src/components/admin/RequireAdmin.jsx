import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function RequireAdmin() {
  const { session } = useAdminAuth();
  const location = useLocation();

  if (!session) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/sign-in" state={{ from }} replace />;
  }

  return <Outlet />;
}
