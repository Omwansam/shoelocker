import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function RequireAdmin() {
  const { session } = useAdminAuth();
  const location = useLocation();

  if (!session) {
    const to = `/admin/login?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
