import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BACKEND_ORDER_STATUSES, labelForOrderStatus } from '../../utils/orderStatus.js';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../utils/api.js';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile, rowsToCsv } from '../../utils/csv.js';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminChip } from '../../components/admin/ui/AdminChip.jsx';
import { AdminTable, AdminTableHead, AdminTableBody, AdminTh, AdminTd } from '../../components/admin/ui/AdminTable.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const rawStatus = params.get('status');
  const activeFilter =
    rawStatus && BACKEND_ORDER_STATUSES.includes(rawStatus) ? rawStatus : 'All';

  const [searchDraft, setSearchDraft] = useState(q);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        per_page: 100,
        search: q || undefined,
        status: activeFilter !== 'All' ? activeFilter : undefined,
      });
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [q, activeFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function applySearch(e) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchDraft.trim()) next.set('q', searchDraft.trim());
    else next.delete('q');
    setParams(next);
  }

  function setFilter(label) {
    const next = new URLSearchParams(params);
    if (label === 'All') next.delete('status');
    else next.set('status', label);
    setParams(next);
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, order_status: newStatus } : o,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  function exportVisible() {
    const header = ['Order', 'Placed', 'Customer', 'Email', 'Status', 'Lines', 'Total_KES'];
    const body = orders.map((o) => [
      `ORD-${String(o.order_id).padStart(3, '0')}`,
      o.order_date,
      o.user?.username || '',
      o.user?.email || '',
      o.order_status,
      o.items_count,
      o.total_amount,
    ]);
    downloadTextFile(
      `shoelocker-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  const filterLabels = useMemo(
    () => [
      { key: 'All', label: 'All' },
      ...BACKEND_ORDER_STATUSES.map((s) => ({ key: s, label: labelForOrderStatus(s) })),
    ],
    [],
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Orders"
        description="Search, filter, and update fulfilment status for live checkout orders."
        actions={
          <AdminButton onClick={exportVisible} disabled={!orders.length}>
            Export ({orders.length})
          </AdminButton>
        }
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form onSubmit={applySearch} className="flex w-full max-w-md gap-2">
          <AdminInput
            className="flex-1"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Order #, email, username…"
          />
          <AdminButton variant="dark" type="submit">Search</AdminButton>
        </form>
        <div className="flex flex-wrap gap-2">
          {filterLabels.map(({ key, label }) => (
            <AdminChip key={key} label={label} active={activeFilter === key} onClick={() => setFilter(key)} />
          ))}
        </div>
      </div>

      <AdminCard padding={false}>
        {loading ? (
          <AdminLoading minHeight="min-h-[200px]" label="Loading orders…" />
        ) : (
          <AdminTable minWidth="min-w-[820px]">
            <AdminTableHead>
              <AdminTh>Order</AdminTh>
              <AdminTh>Placed</AdminTh>
              <AdminTh>Customer</AdminTh>
              <AdminTh>Email</AdminTh>
              <AdminTh>Lines</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh className="text-right">Total</AdminTh>
              <AdminTh> </AdminTh>
            </AdminTableHead>
            <AdminTableBody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                      No orders match — clear search or widen filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const orderLabel = `ORD-${String(o.order_id).padStart(3, '0')}`;
                    return (
                      <tr key={o.order_id} className="transition hover:bg-neutral-50/80">
                        <AdminTd className="font-semibold tabular-nums text-neutral-950">
                          <Link
                            to={`/admin/orders/${o.order_id}`}
                            className="hover:text-brand-red hover:underline"
                          >
                            {orderLabel}
                          </Link>
                        </AdminTd>
                        <AdminTd className="whitespace-nowrap text-neutral-600">
                          {o.order_date
                            ? new Date(o.order_date).toLocaleString('en-KE', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </AdminTd>
                        <AdminTd className="text-neutral-800">{o.user?.username || '—'}</AdminTd>
                        <AdminTd className="text-neutral-600">{o.user?.email || '—'}</AdminTd>
                        <AdminTd className="tabular-nums text-neutral-600">{o.items_count}</AdminTd>
                        <AdminTd>
                          <div className="flex flex-wrap items-center gap-2">
                            <OrderStatusPill status={o.order_status} />
                            <select
                              aria-label={`Status for ${orderLabel}`}
                              value={o.order_status || 'pending'}
                              onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                              className="max-w-[140px] rounded-lg border border-neutral-200 px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-brand-red/25"
                            >
                              {BACKEND_ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {labelForOrderStatus(s)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </AdminTd>
                        <AdminTd className="text-right font-semibold tabular-nums">
                          {formatPrice(Number(o.total_amount) || 0)}
                        </AdminTd>
                        <AdminTd>
                          <Link
                            to={`/admin/orders/${o.order_id}`}
                            className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline"
                          >
                            Open
                          </Link>
                        </AdminTd>
                      </tr>
                    );
                  })
                )}
            </AdminTableBody>
          </AdminTable>
        )}
      </AdminCard>
    </AdminPage>
  );
}
