import { AdminOpsProvider } from '../context/AdminOpsContext.jsx';
import { AdminLayout } from './AdminLayout.jsx';

/** Shared inventory + fulfilment patches for all staff routes */
export function AdminShell() {
  return (
    <AdminOpsProvider>
      <AdminLayout />
    </AdminOpsProvider>
  );
}
